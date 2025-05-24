const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');


const validateRegister = (req,res,next)=>{
    const {userName, password,email} = req.body;

    const errors = [];

    if(!email){
        errors.push('Email is required');
    }
    if(!password){
        errors.push('Password is required');
    }
    if(errors.length > 0){
        return res.status(400).json({message: errors});
    }
    next();
}

const authorization = async (req,res,next)=>{
    const token  = req.header('Authorization') ;
    
    if(!token){
        return res.status(401).json({message: 'Unauthorized: no token provided'});
    }
    const splitToken = token.split(" ");
    
    const realToken = splitToken[1];

    const decoded = jwt.verify(realToken, process.env.ACCESS_TOKEN);
    if(!decoded){
        return res.status(401).json({message: 'Unauthorized: invalid token,please login again'});
    }
    const user = await User.findById(decoded.userId);
    if(!user){
        return res.status(401).json({message: 'Unauthorized: invalid token,please login again'});
    }
    req.user = user;
    console.log(user);

    next();
}


module.exports = {
    validateRegister, authorization
}