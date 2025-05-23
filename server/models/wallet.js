const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    initialBonusAmount: {
      type: Number,
      default: 50,
      min: 0,
    },

    bonusamount: { type: Number, default: 0 },

    depositedamount: { type: Number, default: 0 },
    withdrawAmount: { type: Number, default: 0 },
    totalamount: { type: Number, default: 0 },
    holdAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
