const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    orderId: {
      type: String,
      required: false,
    },
    transactionId: {
      type: String,
      required: false,
    },

    transactionType: {
      type: String,
      enum: [
        "add_money",
        "withdrawal", // to Razorpay
        "game_fee", // joining a game
        "winning_credit", // game won
        "bonus_credit", // bonus added
        "referral_credit", // earned from referral
        "admin_credit", // manually added by admin
        "offer_credit", // added in offers
        "refund", // refunded transaction
      ],
      required: true,
    },
    holdAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: { type: Number, required: true },

    description: {
      type: String,
      required: true,
    },

    bonusUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
