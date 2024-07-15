const bcrypt = require('bcryptjs');
const { sequelize ,Owner, Owner_keys, Owner_OTPS } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const nodemailer = require('nodemailer')

const schema = Joi.object({
    company_name: Joi.string().min(3).required(),
    store_category: Joi.string().required(),
    company_address: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    ein_number: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile_number: Joi.string().min(11).max(11).required(),
    passwordHash: Joi.string().min(6).required(),
});

async function signup(req, res) {
    try {
        const formData = req.body;
        const { error } = schema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            return res.render('signup', {
                messages: {
                    error: req.flash('error'),
                },
                formData: formData
            });
            // return res.redirect('back');
            // return res.status(400).send(error.details[0].message);
        }

         // Check if the name is already registered
         const existingOwner = await Owner.findOne({ where: { company_name: req.body.company_name } });
         if (existingOwner) {
            req.flash('error', 'Company Name already registered');
            return res.render('signup', {
                messages: {
                    error: req.flash('error'),
                },
                formData: formData
            });
            // return res.redirect('back');
            //  return res.status(400).send('Company Name already registered');
         }
        // Check if the email is already registered
        const existingOwner1 = await Owner.findOne({ where: { email: req.body.email } });
        if (existingOwner1) {
            req.flash('error', 'Email already registered');
            return res.render('signup', {
                messages: {
                    error: req.flash('error'),
                },
                formData: formData
            });
            // return res.redirect('back');
            // return res.status(400).send('Email already registered');
        }
        // Check if mobile number is already registered
        const existingOwner2 = await Owner.findOne({ where: { mobile_number: req.body.mobile_number } });
        if (existingOwner2) {
            req.flash('error', 'Mobile number already registered');
            return res.render('signup', {
                messages: {
                    error: req.flash('error'),
                },
                formData: formData
            });
            // return res.redirect('back');
            // return res.status(400).send('Mobile number already registered');
        }
        // Check if EIN number is already registered
        const existingOwner3 = await Owner.findOne({ where: { ein_number: req.body.ein_number } });
        if (existingOwner3) {
            req.flash('error', 'EIN number already registered');
            return res.render('signup', {
                messages: {
                    error: req.flash('error'),
                },
                formData: formData
            });
            // return res.redirect('back');
            // return res.status(400).send('EIN number already registered');
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.passwordHash, salt);

        const transaction = await sequelize.transaction();

        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        
        // Create a new shop owner
        const newOwner = await Owner.create({
            ...req.body,
            passwordHash: hashedPassword,
        }, { transaction });

        console.log(otp, expiresAt, newOwner.email)

        const newOTP = await Owner_OTPS.create({
            otp:otp,
            otp_expiry: expiresAt,
            ownerEmail: newOwner.email
        }, { transaction });

        await sendOTPEmail(newOwner.email, otp)

        await transaction.commit();

        const payload = {
            email: newOwner.email
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '10m' });

        res.redirect(`/api/owner/verify-otp/${token}`)

    } catch (err) {
        console.error(err);
        await transaction.rollback();
        req.flash('error', 'Server error');
        return res.render('signup', {
            messages: {
                error: req.flash('error'),
            },
            formData: formData
        });
        // return res.redirect('back');
        res.status(500).send('Server error');
    }
}

async function login(req, res) {
    const { email_mobile, password } = req.body;

    try {

        if (!email_mobile || !password) {
            req.flash('error', 'Email/mobile number and password are required');
            return res.redirect('back');
            // return res.status(400).json({ message: 'Email/mobile number and password are required' });
        }

        // Check if the owner exists by email or mobile number
        let owner = await Owner.scope('withHash').findOne({ where: { email: email_mobile } });
        if (!owner) {
            owner = await Owner.scope('withHash').findOne({ where: { mobile_number: email_mobile } });
            if (!owner) {
                req.flash('error', 'Shop owner not found!');
                return res.redirect('back');
            }
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, owner.passwordHash);
        if (!isPasswordValid) {
            req.flash('error', 'Invalid credentials');
            return res.redirect('back');
        }

        if(owner.otp_verified==false){
            const otp = generateOTP();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await sendOTPEmail(owner.email, otp)

            const payload = {
                email: owner.email
            };
            const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '10m' });
            const newOTP = await Owner_OTPS.create({
                otp: otp,
                otp_expiry: expiresAt,
                ownerEmail: owner.email
            })
            // owner.otp = otp
            // owner.otp_expiry=expiresAt
    
            return res.redirect(`/api/owner/verify-otp/${token}`)
        }
        // Create and send JWT token
        const token = jwt.sign({ id: owner.id, company_name: owner.company_name }, process.env.SECRET_KEY, { expiresIn: '1h' });

        await Owner_keys.destroy({
            where: {
              ownerCompanyName: owner.company_name,
            },
          });

        const newKey = Owner_keys.create({
            jwt_key: token,
            ownerCompanyName: owner.company_name,
            tokenType: 'access'
        })

        res.cookie('shopOwnerToken', token, {
            httpOnly: true,
            maxAge: 3600000
        });

        return res.status(200).json({message: 'Logged in as '+ owner.company_name });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        return res.redirect('back');
    }
}

async function renderLogin(req, res){
    return res.render('login', { messages: req.flash()});
}

function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(userEmail, otp) {
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.BREVO_SMTP_USERNAME,
            pass: process.env.BREVO_SMTP_PASSWORD 
        }
    });

    const mailOptions = {
        from: 'your-email@example.com',
        to: userEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    // await transporter.sendMail(mailOptions);
    console.log('OTP sent at ' + userEmail + ': ' + otp)
}

async function verifyOTP(req, res){
    const {token} = req.params
    const user = jwt.verify(token, process.env.SECRET_KEY); 
    const {otp} = req.body
    const owner = await Owner.findOne({where:{email: user.email}})
    if(!owner){
        return res.render('error')
        // req.flash('error', 'Invalid Link');
        // return res.redirect('back');
    }
    if(owner.otp_verified==true){
        return res.render('error')
    }

    const now = new Date();
    const latestOTP = await Owner_OTPS.findOne({
        where: { ownerEmail: owner.email },
        order: [['createdAt', 'DESC']]
    });
    console.log(latestOTP.otp)
    console.log(otp);
    console.log(now)
    console.log(Date(latestOTP.otp_expiry));
    console.log(now > new Date(latestOTP.otp_expiry));
    console.log(!latestOTP)
    console.log(latestOTP.otp !== otp);

    if (!latestOTP || (latestOTP.otp !== otp).toString || now > new Date(latestOTP.otp_expiry)) {
        req.flash('error', 'Invalid or expired OTP.');
        return res.redirect('back');
    }

    owner.otp_verified = true;
    await owner.save();

    req.flash('success', 'OTP verified successfully!');
    return res.redirect('/api/owner//login');

    // owner.otp_verified = true;
    // owner.account_verified = true;
    // owner.otp=null
    // owner.otp_expiry=null
    // await owner.save();

    // res.status(200).json({ message: 'OTP verified successfully' });

    req.flash('success', 'OTP Verified, Please login!');
    res.redirect('/api/owner/login');
    
}

function renderSignup(req, res){
    res.render('signup', { messages: req.flash(), formData:{}})
}

async function renderVerifyOTP(req, res){
    try{
        const {token} = req.params
        const user = jwt.verify(token, process.env.SECRET_KEY);
        const owner = await Owner.findOne({where:{email: user.email}})
        if(!owner){
            return res.render('error')
        }
        if(owner.otp_verified==true){
            return res.render('error')
        }
        if(owner.otp_expiry < new Date()){
            return res.render('error')
        }
        res.render('verify-otp', {token})
    }
    catch(e){
        console.log(e)
        return res.render('error')
    }
}

async function resendOTP(req, res){
    try{
    const {token} = req.params
    const user = jwt.verify(token, process.env.SECRET_KEY); 
    const owner = await Owner.findOne({where:{email: user.email}})
    if(!owner){
        return res.render('error')
    }
    if(owner.otp_verified==true){
        return res.render('error')
    }

    const latestOTP = await Owner_OTPS.findOne({
        where: { ownerEmail: owner.email },
        order: [['createdAt', 'DESC']]
    });

    const now = new Date();
    const otpExpiry = new Date(latestOTP.otp_expiry);

        // Calculate the time difference in milliseconds
    const timeDifference = otpExpiry - now;

        // Check if the difference is less than 30 seconds (30,000 milliseconds)
    const limit = 570000;
    if (timeDifference > limit) {
        const secondsRemaining = Math.ceil((timeDifference - limit) / 1000);

        req.flash('error', `Please try again in ${secondsRemaining} seconds!`);
        return res.redirect('back');
    }

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);


    const newOTP = await Owner_OTPS.create({
        otp: otp,
        otp_expiry: expiresAt,
        ownerEmail: owner.email
    })

    // owner.otp=otp
    // owner.otp_expiry=expiresAt

    await sendOTPEmail(owner.email, otp)

    req.flash('success', 'OTP was resent to your email!')
    return res.redirect('back')
}
catch(e){
    console.log(e)
    req.flash('error', 'Error generating OTP, please try again later')
    return res.redirect('back')
}
}

module.exports = {
    signup, login, renderLogin, verifyOTP, renderSignup, renderVerifyOTP, resendOTP
};
