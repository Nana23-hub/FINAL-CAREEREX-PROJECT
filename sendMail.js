const nodemailer = require('nodemailer');


const sendForgotPasswordEmail = async (email,token ) => {

    let mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: `${process.env.EMAIL}`,
            pass: `${process.env.EMAIL_PASSWORD}`
        }
    })
    const mailDetails = {
        from: `${process.env.EMAIL}`,
        to: `${email}`,
        subject: "Forgot Password Notification",
        html: `<h1> Here is the Token to reset your password please click on the button,
        <a href = "http://www.careerex.com/reset-password/${token}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Reset Password</a>
        
        ${token}
        </h1>`
    }
    await mailTransport.sendMail(mailDetails)
}


const validEmail = (email)=> {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = {sendForgotPasswordEmail, validEmail};