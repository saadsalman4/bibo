const bcrypt = require('bcryptjs');
const { sequelize,Owner, Owner_keys, Product, Owner_purchases } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const nodemailer = require('nodemailer')

const schema = Joi.object({
    username: Joi.string().min(3),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

async function addAdmin(req, res){
    try{
        const username = 'admin1'
        const email = 'admin@1.com';
        const password = '1234567'
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminUser = {
            company_name: username,
            email: email,
            passwordHash: hashedPassword,
            user_role: 'admin'
        };
        await Owner.create(adminUser);
        console.log('Admin user created successfully!');
        return res.status(200).json("Admin user created successfully!")

    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}



async function login(req, res) {
    const { email, password } = req.body;

    try{
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
            // req.flash('error', 'Email/mobile number and password are required');
            // return res.redirect('back');
            // 
        }
        let owner = await Owner.scope('withHash').findOne({ where: { email: email, user_role: 'admin' } });
        if(!owner){
            return res.status(400).json({ message: 'Invalid password or username' });
        }
        const isPasswordValid = await bcrypt.compare(password, owner.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid username or password' });
            // req.flash('error', 'Invalid credentials');
            // return res.redirect('back');
        }

        const token = jwt.sign({  username: owner.company_name, email: email }, process.env.SECRET_KEY, { expiresIn: '1h' });
        await Owner_keys.destroy({
            where: {
              ownerCompanyName: owner.company_name,
              tokenType: 'admin'
            },
          });

        const newKey = Owner_keys.create({
            jwt_key: token,
            ownerCompanyName: owner.company_name,
            tokenType: 'admin'
        })

        res.cookie('adminToken', token, {
            httpOnly: true,
            maxAge: 3600000
        });

        return res.status(200).json({message: 'Admin logged in as '+ owner.company_name });
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")

    }
    
}


async function forgotPassword(req, res){
    const transaction = await sequelize.transaction();
    const { email } = req.body;

    try{
        const owner = await Owner.scope('withHash').findOne({ where: { email, user_role: 'admin' }})
        if(!owner){
            return res.status(400).json("Admin not found!")
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

          //mail the user

          console.log(`mail sent to ${email}: ${link}`)
        return res.status(200).json("Reset password link has been sent to your email.");
    }
    catch(e){
        console.log(e)
        return res.status(400).json("Error")
    }
}

async function getProductCount(req, res){
    try{
        const products = await Product.findAll()
        const count = products.length
        return res.status(200).json(count)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}

async function getOrderCount(req, res){
    try{
        const purchases = await Owner_purchases.findAll()
        const count = purchases.length
        return res.status(200).json(count)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}

async function getProductDetails(req, res){
    try{
        const products = await Product.findAll()
        return res.status(200).json(products)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}

async function getOrderDetails(req, res){
    try{
        const purchases = await Owner_purchases.findAll()
        return res.status(200).json(purchases)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}

async function getAllUsers(req, res){
    try{
        const users = await Owner.findAll({where: {user_role: 'owner'}})
        return res.status(200).json(users)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}

async function blockUser(req, res){
    const {id}=req.params
    try{
        const owner = await Owner.findOne({where: {id: id, user_role: 'owner'}})
        if(!owner){
            return res.status(404).json("User not found")
        }
        if(owner.is_blocked==true){
            return res.status(401).json("User already blocked!")
        }
        owner.is_blocked=true;
        await owner.save()
        return res.status(200).json("User blocked successfully!")
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}


module.exports = {
    login, addAdmin, forgotPassword, getProductCount, 
    getOrderCount, getProductDetails, getOrderDetails, getAllUsers, blockUser
};
