const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MyUser",
    unique: true,
    required: true
  },
    balance: {
        type: Number,
        default: 0
    }
},{ timestamps: true});
const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;