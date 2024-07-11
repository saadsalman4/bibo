const bcrypt = require('bcryptjs');
const { sequelize, Owner, Owner_keys } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

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
    const { email } = req.body;

    try{
        const owner = await Owner.scope('withHash').findOne({ where: { email }})
        if(!owner){
            return res.status(400).json("User not found!")
        }
        const secret = process.env.SECRET_KEY + owner.passwordHash;
        const payload = {
            email: owner.email
        };
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        const link = `http://localhost:3000/api/account/reset-password/${email}/${token}`;

        const transaction = await sequelize.transaction();

        await Owner_keys.destroy({
            where: { ownerCompanyName: owner.company_name, resetToken: true },
            transaction
          });
          const key = await Owner_keys.create({
            jwt_key: token,
            resetToken: true,
            ownerCompanyName: owner.company_name
          }, { transaction });

          await transaction.commit();

        //email to user!!
        return res.status(200).json(link)
    }
    catch(e){
        console.log(e)
        await transaction.rollback();
        return res.status(400).json("Error")

    }

}


async function resetPassword(req, res){
    try{
        const { email, token } = req.params;

        const { error } = passwordSchema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const owner = await Owner.scope('withHash').findOne({ where: { email }})
        if(!owner){
            return res.status(400).json("User not found!")
        }
        const tokenCheck = await Owner_keys.findOne({where:{jwt_key:token, resetToken: true, ownerCompanyName:owner.company_name}})
        if(!tokenCheck){
            return res.status(400).json("Invalid token")
        }

        const secret = process.env.SECRET_KEY + owner.passwordHash;

        const user = jwt.verify(token, secret);


        const { newPassword, newPasswordConfirmed } = req.body;
        if(newPassword != newPasswordConfirmed){
            return res.status(400).json("Passwords do not match!")
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        owner.passwordHash = hashedPassword;

        const transaction = await sequelize.transaction();

        await owner.save({ transaction });

        await Owner_keys.destroy({ where: { ownerCompanyName: owner.company_name }, transaction });

        await transaction.commit();

        return res.status(200).json("Password changed successfully!")

        

    }
    catch(error){
        console.log(error)
        return res.status(400).json({error})

    }


}

async function renderResetPassword(req, res){
    const { email, token } = req.params;
    try{

        const owner = await Owner.scope('withHash').findOne({ where: { email }})
        if(!owner){
            return res.status(400).json("Invalid link!")
        }
        const tokenCheck = await Owner_keys.findOne({where:{jwt_key: token, resetToken: true, ownerCompanyName:owner.company_name}})
        if(!tokenCheck){
            return res.status(400).json("Invalid link!")
        }
        const secret = process.env.SECRET_KEY + owner.passwordHash;

        const user = jwt.verify(token, secret);
        
        return res.render('reset-password', { email, token });
    }
    catch(e){
        console.log(e)
        return res.status(400).json("Invalid link!")
    }
}


module.exports = {changePassword, resetPassword, forgotPassword, renderResetPassword}