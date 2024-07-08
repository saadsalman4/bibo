const { Product } = require('../connect');
const jwt = require('jsonwebtoken');
const path = require('path');
const Joi = require('joi');


const read = async (req, res)=>{
    try {
        const { id } = req.params;

        const token = req.cookies.shopOwnerToken;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const company_name = decoded.company_name;
    
        const product = await Product.findOne({ where: { id, ownerCompanyName: company_name } });
        if (!product) {
          return res.status(404).json({ error: 'You dont have permissions to view this product or product not found' });
        }

        if(product.is_active==false){
            return res.status(200).json("Product is inactive")
        }
    
        return res.status(200).json(product);
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: 'An error occurred while fetching the product' });
      }
}

const add = async (req, res)=>{
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file upload is required' });
          }
        const token = req.cookies.shopOwnerToken;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const company_name = decoded.company_name;

        const product = await Product.create({
            ...req.body,
            product_img: path.relative(__dirname, req.file.path),
            ownerCompanyName : company_name
        })
        return res.status(200).json({message: product.product_name + " added successfully by " + company_name})


    }
    catch(e){
        console.log(e)
        return res.status(500).json({ error: 'An error occurred while creating the product' });
    }
}

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.shopOwnerToken;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const company_name = decoded.company_name;
    
        const product = await Product.findOne({ where: { id, ownerCompanyName: company_name } });
        if (!product) {
          return res.status(404).json({ error: 'Product not found or you do not have permission to update this product' });
        }
    
        const productData = {
          ...req.body,
        };
    
        if (req.file) {
          const imagePath = path.relative(__dirname, req.file.path);
          productData.product_img = imagePath;
        }
    
        // Update the product
        await product.update(productData);
    
        return res.status(200).json({ message: `${product.product_name} updated successfully by ${company_name}` });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: 'An error occurred while updating the product' });
      }
    };

const delete_ = async (req, res) => {
    try {
      const { id } = req.params;
      const token = req.cookies.shopOwnerToken;
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const company_name = decoded.company_name;
  
      const product = await Product.findOne({ where: { id, ownerCompanyName: company_name } });
      if (!product) {
        return res.status(404).json({ error: 'Product not found or you do not have permission to delete this product' });
      }
  
    product.is_active = false;
    await product.save();
  
      return res.status(200).json({ message: `${product.product_name} has been marked as inactive successfully` });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'An error occurred while deleting the product' });
    }
  };
  


module.exports = {
    add, update, delete_, read
  };