const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User')
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const jwt = require('jsonwebtoken');
dotenv.config();
const bcrypt = require('bcryptjs');
const {sendForgotPasswordEmail} = require('./sendMail');
const { handleGetAllUsers, handleUserRegistration, handleUsertransaction, handleForgotPassword, handleResetPassword, handleGetWalletBalance, handlePastTransactions, handleLogin } = require('./Controllers/app');
const { validateRegister, authorization } = require('./middlewares/app');

const app = express();

const PORT = process.env.PORT || 6500

app.use(express.json());


mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            
            
        });
    })

    
app.post('/sign-up', validateRegister, handleUserRegistration );

app.post('/login', async (req, res)=>{
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
})

app.post('/forgot-password', async (req, res)=>{
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
        
    

});

app.patch('/reset-password',authorization, async (req, res)=>{
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
});


app.get('/all-users',authorization, handleGetAllUsers);

app.post('/transfer',authorization, handleUsertransaction);


//mongodb+srv://aishatmikailcareerex:<db_password>@cluster0.xz85yj4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//aishatmikailcareerex
//arikeomolara