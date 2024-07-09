const Joi = require('joi');
const fs = require('fs');

const productSchema = Joi.object({
    product_name: Joi.string().required(),
    product_description: Joi.string().required(),
    product_category: Joi.string().required(),
    product_price: Joi.number().required(),
    product_quantity: Joi.number().required()
});

const validateProduct = async (req, res, next)=>{
    console.log(req.body)
    try{
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).send(error.message);
        }
        next();
    }
    catch(err){
        console.log(err);
        return res.status(400).send(err)
    }
}

module.exports = {validateProduct};