const Wallet = require("../models/wallet.model");
const WalletTransaction = require("../models/ledger.model");
const { ApiError } = require("../util/apiError");
const { produceMessage } = require("../kafka/producer");
const { redisClient } = require("../redis/redisClient");

const redis = require("redis");
const client = redis.createClient();
const mongoose = require("mongoose");
require("dotenv").config();

// Helper: Get or create wallet from cache/DB
const getOrCreateWalletFromCache = async (userId) => {
  const key = wallet:${userId};
  let cached = await redisClient.get(key);

  if (cached) return JSON.parse(cached);

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({
      userId,
      creditamount: 0,
      bonusamount: 0,
      withdrawamount: 0,
      totalamount: 0,
    });
    await wallet.save();
  }

  await redisClient.set(key, JSON.stringify(wallet), { EX: 3600 });
  return wallet.toObject();
};

// Helper: Update cache after wallet change
const updateWalletInCache = async (wallet) => {
  const key = wallet:${wallet.userId};
  await redisClient.set(key, JSON.stringify(wallet), { EX: 3600 });
};

const saveWalletAndLogTransaction = async (wallet, txnData = null) => {
  wallet.totalamount =
    Number(wallet.depositedamount || 0) + Number(wallet.withdrawAmount || 0);
  await wallet.save();
  await updateWalletInCache(wallet);

  if (txnData) {
    txnData.remainingBalance = wallet.totalamount;
    await WalletTransaction.create(txnData);
  }
};

// Create wallet if not exists
const walletCreate = async ({ userId }) => {
  if (!userId) throw new ApiError(400, "Invalid request");
  await getOrCreateWalletFromCache(userId);
};

const addMoneyToWallet = async (req, res) => {
  const { userId, amount, amountType, transactionId, orderId, description } =
    req.body;
  try {
    if (!userId || !amount || !amountType) {
      throw new ApiError(400, " required userId, amount and amountType");
    }
    if (amount <= 0) throw new ApiError(400, "Invalid amount");

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        bonusamount: 50,
        depositedamount: 0,
        withdrawAmount: 0,
        totalamount: 50,
        holdAmount: 0,
      });
      isNewWallet = true;
    }

    let transactionType, direction;
    switch (amountType) {
      case "bonus":
        transactionType = "bonus_credit";
        direction = "credit";
        wallet.bonusamount += amount;
        break;

      case "referral":
        transactionType = "referral_credit";
        direction = "credit";
        wallet.bonusamount += amount;
        break;

      case "offer":
        transactionType = "offer_credit";
        direction = "credit";
        wallet.bonusamount += amount;
        break;

      case "admin":
        transactionType = "admin_credit";
        direction = "credit";
        wallet.bonusamount += amount;
        break;

      case "deposit":
        transactionType = "add_money";
        direction = "credit";
        wallet.depositedamount += amount;
        wallet.totalamount += amount;
        break;

      default:
        throw new ApiError(400, "Invalid amount type");
    }

    wallet.totalamount = wallet.depositedamount + wallet.withdrawAmount;

    // Save wallet and create transaction
    await Promise.all([
      wallet.save(),
      WalletTransaction.create({
        userId,
        orderId,
        transactionId,
        transactionType,
        direction,
        amount,
        description:
          description ||
          `${
            direction === "credit" ? "Added" : "Deducted"
          } ${amount} for ${transactionType}`,
        bonusUsed: amountType === "bonus" ? amount : 0,
      }),
    ]);

    // Produce wallet update message
    await produceMessage("wallet.response", {
      status: "success",
      userId,
      transactionId,
      orderId,
      type: transactionType,
      balances: {
        depositedamount: wallet.depositedamount,
        bonusamount: wallet.bonusamount,
        withdrawAmount: wallet.withdrawAmount,
        totalamount: wallet.totalamount,
        holdAmount: wallet.holdAmount,
      },
    });

    res.status(200).json({ wallet });
  } catch (err) {
    await produceMessage("wallet.response", {
      status: "error",
      userId,
      transactionId,
      type: "add_money",
      message: err.message,
    });
    throw err;
  }
};

// Update wallet by type (wining, bonus, withdraw)
const updateWalletAmount = async ({ userId, amount, accountType, txnId }) => {
  try {
    if (!userId || amount == null || !accountType)
      throw new ApiError("All fields required", 400);
    if (amount <= 0) throw new ApiError("Amount must be positive", 400);

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      if (accountType === "withdraw")
        throw new ApiError("Wallet not found for withdrawal", 404);
      wallet = new Wallet({
        userId,
        creditamount: 0,
        bonusamount: 0,
        withdrawamount: 0,
        totalamount: 0,
      });
    }

    switch (accountType) {
      case "wining":
        wallet.creditamount += amount;
        break;
      case "bonus":
        wallet.bonusamount += amount;
        break;
      case "withdraw":
        const available =
          wallet.creditamount + wallet.bonusamount + wallet.withdrawamount;
        if (amount > available) throw new ApiError("Insufficient balance", 400);
        wallet.withdrawamount += amount;
        break;
      default:
        throw new ApiError("Invalid accountType", 400);
    }

    await saveWalletAndLogTransaction(wallet, {
      userId,
      type: accountType,
      amount,
      creditUsed: 0,
      bonusUsed: 0,
      txnId,
    });

    await produceMessage("wallet.response", {
      status: "success",
      userId,
      txnId,
      type: accountType,
      balances: {
        creditamount: wallet.creditamount,
        bonusamount: wallet.bonusamount,
        withdrawamount: wallet.withdrawamount,
        totalamount: wallet.totalamount,
      },
    });

    return wallet;
  } catch (err) {
    await produceMessage("wallet.response", {
      status: "error",
      userId,
      txnId,
      type: accountType,
      message: err.message,
    });
    throw err;
  }
};


// Deduct entry fee
const deductAmountForMatch = async (
  userId,
  amount,
  accountType,
  transactionId,
  orderId = null
) => {
  let wallet;
  try {
    if (!userId || !amount)
      throw new ApiError(400, "userId and amount required");
    if (amount <= 0) throw new ApiError(400, "Amount must be positive");

    wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new ApiError(404, "Wallet not found");

    const available = wallet.intialBonusAmount + wallet.depositedamount;
    if (amount > available) throw new ApiError(400, "Insufficient balance");

    let deductedBonusAmount = 0;
    let deductedDepositAmount = 0;

    if (accountType === "game_fee") {
      // Deduct from bonus first
      deductedBonusAmount = Math.min(wallet.intialBonusAmount, amount);
      wallet.intialBonusAmount -= deductedBonusAmount;

      // Remaining goes from deposit
      const remainingAmount = amount - deductedBonusAmount;
      if (remainingAmount > 0) {
        if (wallet.depositedamount < remainingAmount) {
          throw new ApiError(400, "Insufficient deposited balance");
        }
        deductedDepositAmount = remainingAmount;
        wallet.depositedamount -= deductedDepositAmount;
      }

      // Update total amount
      wallet.totalamount =
        wallet.depositedamount + wallet.bonusamount - wallet.withdrawAmount;

      await wallet.save();

      // Save transaction
      await WalletTransaction.create({
        userId,
        orderId,
        transactionType: "game_fee",
        direction: "debit",
        amount,
        bonusUsed: deductedBonusAmount,
        holdAmount: 0,
        description: Game fee: ₹${deductedBonusAmount} bonus, ₹${deductedDepositAmount} deposited,
      });
    }

    // Send success response
    await produceMessage("wallet.response", {
      status: "success",
      userId,
      transactionId,
      orderId,
      transactionType: accountType,
      balances: {
        depositedamount: wallet.depositedamount,
        bonusamount: wallet.bonusamount,
        withdrawAmount: wallet.withdrawAmount,
        totalamount: wallet.totalamount,
        holdAmount: wallet.holdAmount,
      },
    });

    return wallet;
  } catch (err) {
    await produceMessage("wallet.response", {
      status: "error",
      userId,
      transactionId,
      orderId,
      transactionType: accountType,
      message: err.message,
      balances: wallet
        ? {
            depositedamount: wallet.depositedamount,
            bonusamount: wallet.bonusamount,
            withdrawAmount: wallet.withdrawAmount,
            totalamount: wallet.totalamount,
            holdAmount: wallet.holdAmount,
          }
        : {},
    });
    throw err;
  }
};

const updateWalletAfterMatch = async (
  userId,
  result,
  winAmount = 0,
  transactionId = null,
  orderId = null
) => {
  let wallet;
  try {
    if (!userId || !result)
      throw new ApiError("userId and result required", 400);

    wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new ApiError("Wallet not found", 404);

    if (result === "win" && winAmount > 0) {
      // Credit winnings to withdrawAmount
      wallet.withdrawAmount += winAmount;

      // Update total amount
      wallet.totalamount = wallet.withdrawAmount + wallet.depositedamount;

      await wallet.save();

      // Log win transaction
      await WalletTransaction.create({
        userId,
        orderId,
        transactionType: "wining_credit",
        direction: "credit",
        amount: winAmount,
        bonusUsed: 0,
        creditUsed: winAmount,
        holdAmount: 0,
        description: Match win: ₹${winAmount} credited to withdrawable balance,
      });
    } else {
      wallet.totalamount = wallet.withdrawAmount + wallet.depositedamount;
      await wallet.save();
    }

    // Send Kafka success response
    await produceMessage("wallet.response", {
      status: "success",
      userId,
      transactionId,
      orderId,
      transactionType: "match_result",
      result,
      balances: {
        withdrawAmount: wallet.withdrawAmount,
        bonusamount: wallet.intialBonusAmount,
        depositedamount: wallet.depositedamount,
        totalamount: wallet.totalamount,
        holdAmount: wallet.holdAmount,
      },
    });

    return wallet;
  } catch (err) {
    await produceMessage("wallet.response", {
      status: "error",
      userId,
      transactionId,
      orderId,
      transactionType: "match_result",
      message: err.message,
      balances: wallet
        ? {
            withdrawAmount: wallet.withdrawAmount,
            bonusamount: wallet.intialBonusAmount,
            depositedamount: wallet.depositedamount,
            totalamount: wallet.totalamount,
            holdAmount: wallet.holdAmount,
          }
        : {},
    });

    throw err;
  }
};

module.exports = {
  walletCreate,
  addMoneyToWallet,
  updateWalletAmount,
  deductAmountForMatch,
  updateWalletAfterMatch,
};