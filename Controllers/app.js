 const User = require('../models/User'); 
 const bcrypt = require('bcryptjs');
 const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const {validEmail} = require('../sendMail');
 
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


module.exports = {
    handleGetAllUsers, handleUserRegistration,handleUsertransaction
}