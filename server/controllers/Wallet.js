const Wallet = require("../models/wallet");

const WalletTransaction = require("../models/transcation");

const { ApiError } = require("../util/ApiError");

const createWallet = async (req, res) => {
  try {
    const { userId } = req.body;

    const wallet = await Wallet.create({ userId });

    res.status(200).json({
      success: true,
      message: "Wallet created successfully",
      data: wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getWallet = async (req, res) => {
  try {
    let userId = "6830a0a52c335a42d3304962";
    const wallet = await Wallet.findOne({ userId });

    console.log("wallet", wallet);

    // await wallet.save();

    res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const addMoneyToWallet = async (req, res) => {
  const {
    userId,
    amount,
    amountType,
    transactionId,
    orderId,
    description,
    adminDetails,

  } = req.body;
  try {
    if (!userId || !amount || !amountType) {
      throw new ApiError(400, "required userId", "amount and amountType");
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
      

        if (adminDetails?.initialBonusAmount && !adminDetails?.bonusamount) {
          wallet.initialBonusAmount =
            (wallet.initialBonusAmount || 0) + adminDetails.initialBonusAmount;
        } else if (
          adminDetails?.bonusamount &&
          !adminDetails?.initialBonusAmount
        ) {
          wallet.bonusamount = wallet.bonusamount + adminDetails.bonusamount;
        } else if (
          adminDetails?.initialBonusAmount &&
          adminDetails?.bonusamount
        ) {
          wallet.bonusamount = wallet.bonusamount + adminDetails.bonusamount;

          wallet.initialBonusAmount =
            (wallet.initialBonusAmount || 0) + adminDetails.initialBonusAmount;
        }

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

 

    try {
  
      await wallet.save();

  
      await WalletTransaction.create({
        userId,
        orderId,
        transactionId,
        transactionType,
        direction,
        amount,
        description:
          description ||
          `${direction === "credit" ? "Added" : "Deducted"} ${amount} for ${transactionType}`,
        bonusUsed: amountType === "bonus" ? amount : 0,
      });
    } catch (error) {
     
      console.error("Failed to save wallet or create transaction:", error);

      return res.status(500).json({ error: "Internal server error" });
    }


    // await produceMessage("wallet.response", {
    //   status: "success",
    //   userId,
    //   transactionId,
    //   orderId,
    //   type: transactionType,
    //   balances: {
    //     depositedamount: wallet.depositedamount,
    //     bonusamount: wallet.bonusamount,
    //     withdrawAmount: wallet.withdrawAmount,
    //     totalamount: wallet.totalamount,
    //     holdAmount: wallet.holdAmount,
    //   },
    // });

    res.status(200).json({ wallet });
  } catch (err) {
    await produceMessage("wallet.response", {
      status: "error",
      userId,
      transactionId,
      type: "add_money",
      message: err.message,
    });

    console.error("Error in addMoneyToWallet:", err);
   
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};






module.exports = { createWallet, getWallet, addMoneyToWallet };
