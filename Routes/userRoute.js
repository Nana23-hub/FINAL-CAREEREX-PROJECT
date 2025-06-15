const express = require('express');
const { handleGetAllUsers, handleUserRegistration, handleForgotPassword, handleResetPassword, handleLogin, handleUsertransaction, } = require('../Controllers/app');
const { validateRegister, authorization } = require('../middlewares/app');
const router = express.Router();

router.post('/login', handleLogin);
router.get('/all-users',authorization, handleGetAllUsers);
router.post('/forgot-password', handleForgotPassword);
router.patch('/reset-password',authorization, handleResetPassword);
router.post('/transfer',authorization, handleUsertransaction);
router.post('/sign-up', validateRegister, handleUserRegistration );


module.exports = router;