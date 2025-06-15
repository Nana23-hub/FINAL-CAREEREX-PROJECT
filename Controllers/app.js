 const User = require('../models/User'); 
 const bcrypt = require('bcryptjs');
 const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const {validEmail} = require('../sendMail');
const jwt = require('jsonwebtoken');
 
  const {findUserService} = require('../services/app');


const handleGetAllUsers = async (req, res) => {

    console.log(req.user);
    const allUser = await findUserService();

    res.status(200).json({
        message: 'All users fetched successfully',
        allUser
    })
}



const handleUserRegistration = async (req, res)=>{
    const {userName, email, password} = req.body;
    console.log('incoming sign-up request:', req.body);
    
    try {

   if(!(email)){
         return res.status(400).json({message: 'Email is required'});
   }
   if(!validEmail(email)){
        return res.status(400).json({message: 'Invalid email format'});
   }

    if(!password){
            return res.status(400).json({message: 'Password is required'});
    }

    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({message: 'User already exists'});
    }
    if(password.length < 6){
        return res.status(400).json({message: 'Password must be at least 6 characters'});
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('hashed password:', hashedPassword);
    
    const newUser = new User({
        userName,
        email,
        password: hashedPassword,
        });
        const savedUser = await newUser.save();

        if(!savedUser || !savedUser._id){
            
            
            return res.status(400).json({message: 'User not created'});
        }
        let savedWallet;
        try{
            const newWallet = new Wallet({
            userId: savedUser._id,
            balance: 0
        });
        savedWallet = await newWallet.save();
        } catch (walletError){
            console.error( 'Wallet creation failed:', walletError);
            return res.status(500).json({message: 'User created but wallet creation failed', walletError: walletError.message});
            
        }
        

       return res.status(201).json({
            message: 'User and wallet created successfully',
            user: { email: savedUser.email,
                 userName: savedUser.userName,
                 _id: savedUser._id 
                },
            wallet: savedWallet
            
        });
        
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            return res.status(400).json({message: 'Duplicate key error',
                details: error.keyValue
            });
        }
        



        res.status(500).json({message: error.message});
    }

    
}

const handleUsertransaction = async (req, res)=>{
    const {recipientUserId, amount} = req.body;
    const senderUserId = req.user.userId;

    if(!recipientUserId || !amount || amount <= 0) {
        return res.status(400).json({message: 'Invalid transfer details'});

    }
    if(senderUserId === recipientUserId){
        return res.status(400).json({message: 'You cannot transfer to yourself'});
    }
    const session = await Wallet.startSession();
    session.startTransaction();
    try {
    const senderWallet = await Wallet.findOne({ userId: senderUserId }).session(session);
    const recipientWallet = await Wallet.findOne({ userId: recipientUserId }).session(session);

    if (!senderWallet || !recipientWallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Wallet not found for sender or recipient' });
    }

    if (senderWallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Update balances
    senderWallet.balance -= amount;
    recipientWallet.balance += amount;

    await senderWallet.save({ session });
    await recipientWallet.save({ session });

    const senderTransaction = new Transaction({
      senderId: senderWallet._id,
      recipientId: recipientWallet._id,
      amount,
      status: 'success'
    });

    await senderTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Transfer successful',
      transaction: senderTransaction
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Transfer failed', error: error.message });
  }
    
}
const handleLogin = async (req, res)=>{
        const {email, password} = req.body;
        try {
        const newUser = await User.findOne({email});
        if(!newUser){
            return res.status(400).json({message: 'User not found'});
        }
    const isMatch = await bcrypt.compare(password, newUser?.password);
    console.log(newUser?.password);
    
    if(!isMatch){
        return res.status(400).json({message: 'Incorrect email or password'});
    }
    // if(!newUser.verified){
    //     return res.status(400).json({message: 'User not verified'});
    // }

    const accessToken = jwt.sign(
         {userId: newUser._id},
         process.env.ACCESS_TOKEN, 
        {expiresIn: '1d'});

        const refreshToken = jwt.sign(
            {userId: newUser._id},
            process.env.REFRESH_TOKEN, 
            {expiresIn: '30d'});



    res.status(200).json({
        message: 'Login successful',
        newUser: {email: newUser?.email,
             userName: newUser?.userName},
        accessToken
    });
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
}

const handleForgotPassword = async (req, res)=>{
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user){
     return res.status(400).json({message: 'User not found'});
    }
    const token = jwt.sign(
        {userId: user._id},
        process.env.ACCESS_TOKEN, 
        {expiresIn: '5h'}
    );

    await sendForgotPasswordEmail(email, token);
    // const resetLink = `http://www.careerex.com/reset-password/${token}`;

    try{
        await sendForgotPasswordEmail(email, token);
        res.json({
            message: 'Password reset link sent to your email',
            user: {
                email: user.email,
                userName: user.userName
        }
    });
}catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({message: 'Failed to send email' })
    
 }
        
}
const handleResetPassword = async (req, res)=>{
    const {password} = req.body;
    const user = await User.findOne({email: req.user.email});
    if(!user){
     return res.status(400).json({message: 'User not found'});
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();
    res.json({
        message: 'Password reset successfully'})
}

const handleGetWalletBalance = async (req, res) => {
    try{
        const wallet = await Wallet.findOne({userId: req.user._id});
        if (!wallet) 
            return res.status(404).json({message: 'Wallet not found'});

            res.json({
                balance: wallet.balance
            });
        
    }catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({message: 'Internal server error'});
    }
}

const handlePastTransactions = async(req,res)=>{
    try{
        const wallet = await Wallet.findOne({userId: req.user.userId});
        if (!wallet) 
            return res.status(404).json({message: 'Wallet not found'});

        const transactions = await Transaction.find({ walletId: wallet._id}).sort({ createdAt: -1 });
        res.json({
            transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({message: 'Internal server error'});
    }
    
}

module.exports = {
    handleGetAllUsers,
     handleUserRegistration,
     handleUsertransaction,
     handleLogin,
     handleForgotPassword,
    handleResetPassword,
    handleGetWalletBalance,
    handlePastTransactions
}