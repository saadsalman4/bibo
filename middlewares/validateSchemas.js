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
    try{
        const { error } = productSchema.validate(req.body);
        if (error) {
            // console.log(error)
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (unlinkError) => {
                    if (unlinkError) {
                        console.error('Error deleting file:', unlinkError);
                    }
                });
            }

            return res.status(400).send(error.message);
        }
        next();
    }
    catch(err){
        return res.status(400).send(err)
    }
}

module.exports = {validateProduct};