const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./User')
const Wallet = require('./Wallet')
const jwt = require('jsonwebtoken');
dotenv.config();
const bcrypt = require('bcryptjs');

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

    
app.post('/sign-up', async (req, res)=>{
    const {userName, email, password} = req.body;
    console.log('incoming sign-up request:', req.body);
    
    try {

   if(!email){
         return res.status(400).json({message: 'Email is required'});
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

        if(!savedUser || savedUser._id){
            
            
            return res.status(400).json({message: 'User not created'});
        }

        const newWallet = new Wallet({
            userId: savedUser._id,
            balance: 0
        });
        const savedWallet = await newWallet.save();
        console.log('saved wallet:', savedWallet._id);
        

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

    
})

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





//mongodb+srv://aishatmikailcareerex:<db_password>@cluster0.xz85yj4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//aishatmikailcareerex
//arikeomolara