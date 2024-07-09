const bcrypt = require('bcryptjs');
const { sequelize, Owner_purchases, Product } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

async function viewListing (req, res){
    try{
        const {id} = req.params;
        const product = await Product.findOne({ where: { id } });
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        if(product.is_active==false || product.is_deleted){
            return res.status(200).json("Product not found")
        }


        return res.status(200).json(product);
    }
    catch(e){
        console.log(e);
        return res.status(500).json({ error: 'An error occurred while fetching the product' });
    }
}

async function purchaseItem (req, res){
    const transaction = await sequelize.transaction();
    try{
        const {id}= req.params
        const purchase_quantity = req.body.purchase_quantity
        const company_name = req.user.company_name

        const product = await Product.findOne({ where: { id } });
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        if(product.ownerCompanyName == company_name){
            return res.status(400).json("Cannot purchase own products!")
        }

        if(product.is_active==false || product.is_deleted){
            return res.status(400).json("Product not found")
        }

        if(purchase_quantity>product.product_quantity){
            return res.status(400).json("Not enough products in stock!")
        }


        const newPurchase = {
            product_name: product.product_name,
            product_description: product.product_description,
            product_category: product.product_category,
            product_price: product.product_price,
            product_img: product.product_img,
            purchase_quantity: purchase_quantity,
            purchaser: company_name
        }


        product.product_quantity = product.product_quantity - purchase_quantity

        if(product.product_quantity==0){
            product.is_active=false;
        }

        await Owner_purchases.create(newPurchase, { transaction });
        await product.save({ transaction });

        await transaction.commit();

        return res.status(200).json("Purchase completed successfully!")
    }
    catch(e){
        console.log(e)
        await transaction.rollback();
        return res.status(400).json("Error making purchase!")

    }
}
module.exports = {viewListing, purchaseItem}