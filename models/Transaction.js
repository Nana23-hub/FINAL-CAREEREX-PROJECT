const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true
    },
    recipientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    transactionType: {
        type: String,
        enum: ['deposit', 'withdrawal', 'transfer'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    }
},{timestamps: true});

const Transacction = mongoose.model("Transaction", transactionSchema);
module.exports = Transacction;