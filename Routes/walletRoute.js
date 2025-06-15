const express = require('express');
const { handleGetWalletBalance, handlePastTransactions } = require('../Controllers/app');
const router = express.Router();

router.get('/balance',handleGetWalletBalance);
router.post('/Trancaction', handlePastTransactions);


module.exports = router;