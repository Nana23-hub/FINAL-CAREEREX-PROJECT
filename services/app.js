const User = require('../models/User');
const findUserService = async ()=>{
    const allUser = await User.find();
    return allUser;
}

module.exports = {
    findUserService
}