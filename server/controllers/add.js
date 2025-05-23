const { consumer, producer } = require("../kafka");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const redisClient = require("../utils/redisClient");

const TOPIC = "wallet.add-money.request";
const WALLET_RESPONSE_TOPIC = "wallet.response";


async function runWalletConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const request = JSON.parse(message.value.toString());

      const {
        userId,
        amount,
        amountType,
        transactionId,
        orderId,
        description,
        adminDetails,
      } = request;

      // Idempotency check
      const txnExists = await redisClient.get(transactionId);
      if (txnExists) return;

      try {
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
        }

        let transactionType,
          direction = "credit";

        switch (amountType) {
          case "bonus":
            transactionType = "bonus_credit";
            wallet.bonusamount += amount;
            break;
          case "referral":
            transactionType = "referral_credit";
            wallet.bonusamount += amount;
            break;
          case "offer":
            transactionType = "offer_credit";
            wallet.bonusamount += amount;
            break;
          case "admin":
            transactionType = "admin_credit";
            if (adminDetails?.initialBonusAmount)
              wallet.initialBonusAmount =
                (wallet.initialBonusAmount || 0) +
                adminDetails.initialBonusAmount;
            if (adminDetails?.bonusamount)
              wallet.bonusamount += adminDetails.bonusamount;
            break;
          case "deposit":
            transactionType = "add_money";
            wallet.depositedamount += amount;
            break;
          default:
            throw new Error("Invalid amount type");
        }

        wallet.totalamount = wallet.depositedamount + wallet.withdrawAmount;
        await wallet.save();

        await WalletTransaction.create({
          userId,
          transactionId,
          orderId,
          transactionType,
          direction,
          amount,
          description: description || `Added ${amount} for ${transactionType}`,
          bonusUsed: amountType === "bonus" ? amount : 0,
        });

        await redisClient.set(transactionId, "processed", { EX: 60 * 60 }); // 1 hour TTL

        await producer.send({
          topic: "wallet.add-money.response",
          messages: [
            {
              value: JSON.stringify({
                status: "success",
                userId,
                transactionId,
                balances: {
                  depositedamount: wallet.depositedamount,
                  bonusamount: wallet.bonusamount,
                  withdrawAmount: wallet.withdrawAmount,
                  totalamount: wallet.totalamount,
                  holdAmount: wallet.holdAmount,
                },
              }),
            },
          ],
        });
      } catch (err) {
        console.error("Wallet processing failed", err.message);

        await producer.send({
          topic: "wallet.add-money.response",
          messages: [
            {
              value: JSON.stringify({
                status: "error",
                userId,
                transactionId,
                message: err.message,
              }),
            },
          ],
        });
      }
    },
  });
}

module.exports = runWalletConsumer;





const deductAmountForMatch = async (
  userId,
  amount,
  accountType,
  transactionId,
  orderId = null
) => {
  let wallet;

  // Idempotency check — skip if transactionId already processed
  const alreadyProcessed = await redisClient.get(transactionId);
  if (alreadyProcessed) {
    // Early exit: send success response without reprocessing
    // (Alternatively, you can just return to avoid duplication)
    await producer.send({
      topic: WALLET_RESPONSE_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            status: "success",
            userId,
            transactionId,
            orderId,
            transactionType: accountType,
            message: "Transaction already processed",
          }),
        },
      ],
    });
    return;
  }

  try {
    if (!userId || !amount)
      throw new ApiError(400, "userId and amount are required");
    if (amount <= 0) throw new ApiError(400, "Amount must be positive");

    wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new ApiError(404, "Wallet not found");

    // Fix typo: you had intialBonusAmount, I assume initialBonusAmount
    const initialBonusAmount = wallet.initialBonusAmount || 0;
    const bonusAmount = wallet.bonusamount || 0;
    const depositedAmount = wallet.depositedamount || 0;

    // Available balance for deduction is initialBonusAmount + depositedAmount
    const available = initialBonusAmount + depositedAmount;
    if (amount > available) throw new ApiError(400, "Insufficient balance");

    let deductedBonusAmount = 0;
    let deductedDepositAmount = 0;

    if (accountType === "game_fee") {
      // Deduct from initialBonusAmount first
      deductedBonusAmount = Math.min(initialBonusAmount, amount);
      wallet.initialBonusAmount = initialBonusAmount - deductedBonusAmount;

      const remainingAmount = amount - deductedBonusAmount;
      if (remainingAmount > 0) {
        if (depositedAmount < remainingAmount)
          throw new ApiError(400, "Insufficient deposited balance");

        deductedDepositAmount = remainingAmount;
        wallet.depositedamount = depositedAmount - deductedDepositAmount;
      }

      // Recalculate totalamount
      // Assuming withdrawAmount is part of wallet and bonusamount is separate from initialBonusAmount
      wallet.totalamount =
        (wallet.depositedamount || 0) +
        (wallet.bonusamount || 0) -
        (wallet.withdrawAmount || 0);

      await wallet.save();

      await WalletTransaction.create({
        userId,
        orderId,
        transactionType: "game_fee",
        direction: "debit",
        amount,
        bonusUsed: deductedBonusAmount,
        holdAmount: 0,
        description: `Game fee: ₹${deductedBonusAmount} bonus, ₹${deductedDepositAmount} deposited`,
      });
    } else {
      // For other accountTypes, throw error or handle accordingly
      throw new ApiError(400, `Unsupported accountType: ${accountType}`);
    }

    // Mark transaction as processed in Redis with TTL (1 hour)
    await redisClient.set(transactionId, "processed", { EX: 60 * 60 });

    // Send Kafka success response
    await producer.send({
      topic: WALLET_RESPONSE_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            status: "success",
            userId,
            transactionId,
            orderId,
            transactionType: accountType,
            balances: {
              depositedamount: wallet.depositedamount,
              bonusamount: wallet.bonusamount,
              initialBonusAmount: wallet.initialBonusAmount,
              withdrawAmount: wallet.withdrawAmount,
              totalamount: wallet.totalamount,
              holdAmount: wallet.holdAmount,
            },
          }),
        },
      ],
    });

    return wallet;
  } catch (err) {
    // Wrap error if not already ApiError
    const error =
      err instanceof ApiError ? err : new ApiError(500, err.message);

    // Send Kafka error response
    await producer.send({
      topic: WALLET_RESPONSE_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            status: "error",
            userId,
            transactionId,
            orderId,
            transactionType: accountType,
            message: error.message,
            balances: wallet
              ? {
                  depositedamount: wallet.depositedamount,
                  bonusamount: wallet.bonusamount,
                  initialBonusAmount: wallet.initialBonusAmount,
                  withdrawAmount: wallet.withdrawAmount,
                  totalamount: wallet.totalamount,
                  holdAmount: wallet.holdAmount,
                }
              : {},
          }),
        },
      ],
    });

    throw error;
  }
};

module.exports = deductAmountForMatch;



const WALLET_RESPONSE_TOPIC = "wallet.response";

const updateWalletAfterMatch = async (
  userId,
  result,
  winAmount = 0,
  orderId = null
) => {
  let wallet;

  try {
    if (!userId || !result) {
      throw new ApiError(400, "userId and result are required");
    }

    // Optional: use orderId to avoid replay if needed
    if (orderId) {
      const alreadyProcessed = await redisClient.get(`match-result:${orderId}`);
      if (alreadyProcessed) return; // Skip if already processed
    }

    wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    if (result === "win" && winAmount > 0) {
      wallet.withdrawAmount += winAmount;
      wallet.totalamount = wallet.withdrawAmount + wallet.depositedamount;

      await wallet.save();

      await WalletTransaction.create({
        userId,
        orderId,
        transactionType: "wining_credit",
        direction: "credit",
        amount: winAmount,
        bonusUsed: 0,
        creditUsed: winAmount,
        holdAmount: 0,
        description: `Match win: ₹${winAmount} credited to withdrawable balance`,
      });
    } else {
      wallet.totalamount = wallet.withdrawAmount + wallet.depositedamount;
      await wallet.save();
    }

    // Save match processed status in Redis for 1 hour
    if (orderId) {
      await redisClient.set(`match-result:${orderId}`, "processed", {
        EX: 60 * 60,
      });
    }

    await producer.send({
      topic: WALLET_RESPONSE_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            status: "success",
            userId,
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
          }),
        },
      ],
    });

    return wallet;
  } catch (err) {
    await producer.send({
      topic: WALLET_RESPONSE_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            status: "error",
            userId,
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
          }),
        },
      ],
    });

    throw err;
  }
};

module.exports = updateWalletAfterMatch;



const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { producer } = require("../kafka");
const redisClient = require("../utils/redisClient");
const ApiError = require("../utils/ApiError");
const { v4: uuidv4 } = require("uuid");

const WITHDRAW_TOPIC = "payment.withdraw.request";

const withdrawAmountFromWallet = async (userId, amount, orderId = null) => {
  let wallet;
  const transactionId = uuidv4();

  try {
    // Validate inputs
    if (!userId || !amount) {
      throw new ApiError(400, "userId and amount are required");
    }

    if (amount <= 0) {
      throw new ApiError(400, "Amount must be greater than zero");
    }

    // Check Redis idempotency (optional if you want to prevent duplicate withdrawals quickly)
    const alreadyProcessed = await redisClient.get(`withdraw:${transactionId}`);
    if (alreadyProcessed) {
      throw new ApiError(400, "Duplicate withdrawal request");
    }

    wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    if (wallet.withdrawAmount < amount) {
      throw new ApiError(400, "Insufficient withdrawable balance");
    }

    // Deduct from withdrawable amount
    wallet.withdrawAmount -= amount;
    wallet.totalamount = wallet.withdrawAmount + wallet.depositedamount;
    await wallet.save();

    // Record the transaction
    await WalletTransaction.create({
      userId,
      orderId,
      transactionId,
      transactionType: "withdrawal",
      direction: "debit",
      amount,
      description: `User requested withdrawal of ₹${amount}`,
      bonusUsed: 0,
      holdAmount: 0,
    });

    // Cache transaction to avoid duplicates
    await redisClient.set(`withdraw:${transactionId}`, "processing", {
      EX: 60 * 60,
    }); // 1 hour

    // Send request to payment service (via Kafka)
    await producer.send({
      topic: WITHDRAW_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            userId,
            transactionId,
            amount,
            orderId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    return {
      status: "success",
      message: "Withdrawal request submitted",
      transactionId,
      balances: {
        withdrawAmount: wallet.withdrawAmount,
        depositedamount: wallet.depositedamount,
        bonusamount: wallet.initialBonusAmount,
        totalamount: wallet.totalamount,
        holdAmount: wallet.holdAmount,
      },
    };
  } catch (err) {
    throw err instanceof ApiError
      ? err
      : new ApiError(500, "Failed to process withdrawal");
  }
};

module.exports = withdrawAmountFromWallet;
