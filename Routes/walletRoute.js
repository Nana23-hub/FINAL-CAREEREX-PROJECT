const express = require('express');
const { handleGetWalletBalance, handlePastTransactions } = require('../Controllers/app');
const { authorization } = require('../middlewares/app');
const router = express.Router();

router.get('/balance', authorization,handleGetWalletBalance);
router.get('/Trancaction', authorization, handlePastTransactions);


module.exports = router;