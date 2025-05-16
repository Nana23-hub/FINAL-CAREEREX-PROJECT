const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MyUser',
    required: true,
    unique: true
  },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD'
    }
    

},{ timestamps: true});
const Wallet = mongoose.model('MyWallet', walletSchema);
module.exports = Wallet;