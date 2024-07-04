const bcrypt = require('bcryptjs');
const { Owner } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const schema = Joi.object({
    company_name: Joi.string().required(),
    store_category: Joi.string().required(),
    company_address: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    ein_number: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile_number: Joi.string().required(),
    passwordHash: Joi.string().required(),
});

async function signup(req, res) {
    try {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

         // Check if the name is already registered
         const existingOwner = await Owner.findOne({ where: { company_name: req.body.company_name } });
         if (existingOwner) {
             return res.status(400).send('Company Name already registered');
         }
        // Check if the email is already registered
        const existingOwner1 = await Owner.findOne({ where: { email: req.body.email } });
        if (existingOwner1) {
            return res.status(400).send('Email already registered');
        }
        // Check if mobile number is already registered
        const existingOwner2 = await Owner.findOne({ where: { mobile_number: req.body.mobile_number } });
        if (existingOwner2) {
            return res.status(400).send('Mobile number already registered');
        }
        // Check if EIN number is already registered
        const existingOwner3 = await Owner.findOne({ where: { ein_number: req.body.ein_number } });
        if (existingOwner3) {
            return res.status(400).send('EIN number already registered');
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.passwordHash, salt);

        // Create a new shop owner
        const newOwner = await Owner.create({
            ...req.body,
            passwordHash: hashedPassword,
        });

        return res.status(200).json(newOwner.toJSON());

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

async function login(req, res) {
    const { email_mobile, password } = req.body;

    try {

        if (!email_mobile || !password) {
            return res.status(400).json({ message: 'Email/mobile number and password are required' });
        }

        // Check if the owner exists by email or mobile number
        let owner = await await Owner.scope('withHash').findOne({ where: { email: email_mobile } });
        if (!owner) {
            owner = await await Owner.scope('withHash').findOne({ where: { mobile_number: email_mobile } });
            if (!owner) {
                return res.status(404).json({ message: 'Shop owner not found' });
            }
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, owner.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create and send JWT token
        const token = jwt.sign({ id: owner.id }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 3600000
        });

        return res.status(200).json({message: 'Logged in!' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

module.exports = {
    signup, login
};
