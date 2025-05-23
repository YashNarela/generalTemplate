const mongoose = require("mongoose");

const TransSchema = new mongoose.Schema({
  walletid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
  },
  amount: {
    type: Number,
    default: 0,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  AmountReqType: {
    type: String,
    enum: ["credit", "debit"],
  },

  txId: {
    type: String,
  },

  currentBalance: {
    type: Number,
    default: 0,
  },

  beforeBalance: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Trans", TransSchema);
