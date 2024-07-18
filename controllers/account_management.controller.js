const bcrypt = require('bcryptjs');
const { sequelize, Owner, Owner_keys, Owner_OTPS } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const {generateOTP, sendOTPEmail, resendOTP } = require("./owner_auth.controller")


const passwordSchema = Joi.object({
    oldPassword: Joi.string().min(6),
    newPassword: Joi.string().min(6).required(),
    newPasswordConfirmed: Joi.string().min(6).required(),
});

async function changePassword(req, res){
    try{
        const { error } = passwordSchema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        const { oldPassword, newPassword, newPasswordConfirmed } = req.body;

        if(newPassword != newPasswordConfirmed){
            return res.status(400).json("Passwords do not match!")
        }

        if(newPassword == oldPassword){
            return res.status(400).json("Old password entered!")
        }

        const owner = await Owner.scope('withHash').findOne({ where: { company_name: req.user.company_name }})

        if (!owner) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, owner.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        owner.passwordHash = hashedPassword;

        const transaction = await sequelize.transaction();

        await owner.save({ transaction });

        await Owner_keys.destroy({ where: { ownerCompanyName: req.user.company_name }, transaction });

        await transaction.commit();

        res.clearCookie('shopOwnerToken');

        return res.status(200).json({ message: 'Password changed successfully, please login again!' });
        
    }
    catch(e){
        console.error(e);
        return res.status(500).json({ error: 'An error occurred while changing the password' });
    }
}

async function forgotPassword(req, res){
    const transaction = await sequelize.transaction();
    const { email } = req.body;

    try{

        const owner = await Owner.scope('withHash').findOne({ where: { email }})
        if(!owner){
            req.flash('error', 'User not found!');
            return res.redirect('back');

            return res.status(400).json("User not found!")
        }
        const payload = {
            email: owner.email
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '15m' });
        const link = `http://localhost:3000/api/account/reset-password/${token}`;

        

        await Owner_keys.destroy({
            where: { ownerCompanyName: owner.company_name, tokenType: 'reset' },
            transaction
          });
          const key = await Owner_keys.create({
            jwt_key: token,
            tokenType: 'reset',
            ownerCompanyName: owner.company_name
          }, { transaction });

          await transaction.commit();

          
          const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.BREVO_SMTP_USERNAME, // your Brevo SMTP username
                pass: process.env.BREVO_SMTP_PASSWORD  // your Brevo SMTP password
            }
        });

        // Send email with defined transport object
        // const info = await transporter.sendMail({
        //     from: 'saad.salman@eplanetglobal.com', // sender address
        //     to: email, // list of receivers
        //     subject: "Password Reset", // Subject line
        //     text: `You requested a password reset. Click this link to reset your password: ${link}`, // plain text body
        //     html: `<p>You requested a password reset. Click this link to reset your password: <a href="${link}">${link}</a></p>` // html body
        // });

        // console.log('Message sent: %s', info.messageId);
        console.log(`mail sent to ${email}: ${link}`)
        return res.status(200).json("Reset password link has been sent to your email.");
    
    }
    catch(e){
        console.log(e)
        // await transaction.rollback();
        return res.status(400).json("Error")

    }

}

async function forgotPasswordMobile(req, res){
    const { email } = req.body;

    try{

        const owner = await Owner.scope('withHash').findOne({ where: { email }})
        if(!owner){
            req.flash('error', 'User not found!');
            return res.redirect('back');
        }
        const otp = generateOTP()
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const newOTP = await Owner_OTPS.create({
            otp: otp,
            otp_expiry: expiresAt,
            ownerEmail: owner.email,
            otp_type: 'reset',
        })
        await sendOTPEmail(owner.email, otp)

        const payload = {
            email: owner.email
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '10m' });

        await Owner_keys.destroy({
            where: {
              ownerCompanyName: owner.company_name,
              tokenType: 'reset'
            },
          });

        const newKey = Owner_keys.create({
            jwt_key: token,
            ownerCompanyName: owner.company_name,
            tokenType: 'reset'
        })

        res.cookie('resetToken', token, {
            httpOnly: true,
            maxAge: 600000
        });

        return res.redirect('verify-otp-mobile')
        return res.render('verify-otp-mobile', {token: token})

        return res.status(200).json("OTP sent sucessfully!")


        

    }
    catch(e){
        console.log(e)
        req.flash('error', 'Error!');
        return res.redirect('back');

    }
}

async function resetPassword(req, res){
    try{
        const { token } = req.params;

        const user = jwt.verify(token, process.env.SECRET_KEY);

        const { error } = passwordSchema.validate(req.body);
        if (error) {
            console.log(req.body)
            req.flash('error', 'Password must be atleast 6 characters long');
            return res.redirect('back');

        }

        const owner = await Owner.scope('withHash').findOne({ where: { email: user.email }})
        if(!owner){
            req.flash('error', 'User not found');
            return res.redirect('back');
        }
        const tokenCheck = await Owner_keys.findOne({where:{jwt_key:token, tokenType: 'reset', ownerCompanyName:owner.company_name}})
        if(!tokenCheck){
            req.flash('error', 'Link expired');
            return res.redirect('back');
        }

        


        const { newPassword, newPasswordConfirmed } = req.body;
        if(newPassword != newPasswordConfirmed){
            req.flash('error', 'Passwords do not match!');
            return res.redirect('back');
            return res.status(400).json("Passwords do not match!")
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        owner.passwordHash = hashedPassword;

        const transaction = await sequelize.transaction();

        await owner.save({ transaction });

        await Owner_keys.destroy({ where: { ownerCompanyName: owner.company_name }, transaction });

        await transaction.commit();

        req.flash('success', 'Password changed successfully. Please login!');
        return res.redirect('/api/owner/login');
        return res.status(200).json("Password changed successfully!")

        

    }
    catch(error){
        console.log(error)
        req.flash('error', error);
        return res.redirect('back');
        return res.status(400).json({error})

    }


}

async function renderResetPassword(req, res){
    const { token } = req.params;
    try{
        const user = jwt.verify(token, process.env.SECRET_KEY);

        const owner = await Owner.scope('withHash').findOne({ where: { email: user.email }})
        if(!owner){
            return res.render('error');
        }
        const tokenCheck = await Owner_keys.findOne({where:{jwt_key: token, tokenType: 'reset', ownerCompanyName:owner.company_name}})
        if(!tokenCheck){
            return res.render('error');
        }
        const email = user.email

        
        
        return res.render('reset-password', { messages: req.flash(), email, token });
    }
    catch(e){
        console.log(e)
        return res.render('error');
    }
}

async function renderForgotPassword(req, res){
    res.render('forgot-password')
}

async function verifyOTPMobile(req, res){
    const {otp} = req.body
    const token = req.cookies.resetToken;

    if (!token) {
    return res.status(401).json({ error: 'No token found' });
    }

    try {

    const user = jwt.verify(token, process.env.SECRET_KEY); 

    const checkKey = await Owner_keys.findOne({ where: {jwt_key: token, tokenType: 'reset'}});
    if(!checkKey){
      return res.status(400).json({error: "Invalid token!"})
    }

    const owner = await Owner.findOne({where:{email: user.email}})
    if(!owner){
        // return res.render('error')
        req.flash('error', 'Invalid Link');
        return res.redirect('back');
    }

    const now = new Date();

    const latestOTP = await Owner_OTPS.findOne({
        where: { ownerEmail: owner.email, otp_type: 'reset', },
        order: [['createdAt', 'DESC']]
    });

    if (!latestOTP) {
        // return res.status(401).json("Invalid OTP")
        return res.render('error')
    }

    const savedOTP = latestOTP.otp.toString().trim();
    const enteredOTP = otp.toString().trim();

    if (savedOTP !== enteredOTP || now > new Date(latestOTP.otp_expiry)) {
        req.flash('error', 'Invalid OTP');
        return res.redirect('back');
        return res.status(401).json("Invalid OTP")
        req.flash('error', 'Invalid or expired OTP.');
        return res.redirect('back');
    }
    const payload = {
        email: owner.email
    };
    const token2 = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '10m' });

    await Owner_keys.destroy({
        where: {
          ownerCompanyName: owner.company_name,
          tokenType: 'reset'
        },
      });

    const newKey = Owner_keys.create({
        jwt_key: token2,
        ownerCompanyName: owner.company_name,
        tokenType: 'reset'
    })

    res.cookie('OTP_Verified', token2, {
        httpOnly: true,
        maxAge: 600000
    });

    
    res.clearCookie('resetToken');
    

    return res.redirect('reset-password-mobile')
    return res.status(200).json("OTP Validated")



    }
    catch(e){
        console.log(e)
        return res.status(500).json("error")
    }
}   

async function resetPasswordMobile(req, res){
    try{
        const token = req.cookies.OTP_Verified;
        if(!token){
            return res.status(400).json({error: "Invalid token!"})
        }

        const checkKey = await Owner_keys.findOne({ where: {jwt_key: token, tokenType: 'reset'}});
        if(!checkKey){
            return res.status(400).json({error: "Invalid token!"})
        }

        const user = jwt.verify(token, process.env.SECRET_KEY);

        const { error } = passwordSchema.validate(req.body);
        if (error) {
            console.log(req.body)
            // return res.status(400).json("6 chs")
            req.flash('error', 'Password must be atleast 6 characters long');
            return res.redirect('back');

        }

        const owner = await Owner.scope('withHash').findOne({ where: { email: user.email }})
        if(!owner){
            return res.status(400).json("not found")
            req.flash('error', 'User not found');
            return res.redirect('back');
        }
        // const tokenCheck = await Owner_keys.findOne({where:{jwt_key:token, tokenType: 'reset', ownerCompanyName:owner.company_name}})
        // if(!tokenCheck){
        //     req.flash('error', 'Link expired');
        //     return res.redirect('back');
        // }


        


        const { newPassword, newPasswordConfirmed } = req.body;
        if(newPassword != newPasswordConfirmed){
            return res.status(400).json("Passwords do not match!")
            req.flash('error', 'Passwords do not match!');
            return res.redirect('back');
            return res.status(400).json("Passwords do not match!")
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        owner.passwordHash = hashedPassword;

        const transaction = await sequelize.transaction();

        await owner.save({ transaction });

        await Owner_keys.destroy({ where: { ownerCompanyName: owner.company_name }, transaction });

        await transaction.commit();

        // return res.status(200).json("Password changed!")
        
        res.clearCookie('OTP_Verified');

        req.flash('success', 'Password changed successfully. Please login!');
        return res.redirect('/api/owner/login');
        return res.status(200).json("Password changed successfully!")

        

    }
    catch(error){
        console.log(error)
        req.flash('error', error);
        return res.redirect('back');
        return res.status(400).json({error})

    }


}

function renderForgotPasswordMobile(req, res){
     res.render('forgot-password-mobile')
}

function renderVerifyOTPMobile(req, res){
    const token = req.cookies.resetToken
    if(!token){
        return res.render('error')
    }
    res.render('verify-otp-mobile')
}

function renderResetPasswordMobile(req, res){
    const token = req.cookies.OTP_Verified
    if(!token){
        return res.render('error')
    }
    res.render('reset-password-mobile')
}

module.exports = {changePassword, resetPassword, forgotPassword, 
    renderResetPassword, renderForgotPassword, forgotPasswordMobile, 
    verifyOTPMobile, resetPasswordMobile, renderForgotPasswordMobile, renderResetPasswordMobile, renderVerifyOTPMobile}