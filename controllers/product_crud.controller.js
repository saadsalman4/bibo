const { Product } = require('../connect');
const path = require('path');
const Joi = require('joi');
const fs = require('fs');

const read = async (req, res)=>{
    try {
        const { id } = req.params;

        const company_name = req.user.company_name;
    
        const product = await Product.findOne({ where: { id, ownerCompanyName: company_name } });
        if (!product) {
          return res.status(404).json({ error: 'You dont have permissions to view this product or product not found' });
        }

        if(product.is_active==false || product.is_deleted){
            return res.status(200).json("Product not found")
        }
        const host = req.get('host');
        product.product_img=host + '/' + product.product_img.split(path.sep).join('/')

        return res.status(200).json(product);
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: 'An error occurred while fetching the product' });
      }
}

const add = async (req, res)=>{

    try {
      if (!req.files || !req.files.length) {
        return res.status(400).json({ error: 'Image file upload is required' });
      }
        const company_name = req.user.company_name;

        const uploadedFile = req.files[0];
        // console.log(uploadedFile);
        const fileName = Date.now() + '_' + uploadedFile.originalname;
        
        const filePath = path.join('img', 'products', fileName);
        
        fs.writeFile(filePath, uploadedFile.buffer, async (err) => {
          if (err) {
            console.error('Error saving file:', err);
            return res.status(500).json({ error: 'An error occurred while saving the file' });
          }

        const product = await Product.create({
            ...req.body,
            product_img: filePath,
            ownerCompanyName : company_name
        })

        const host = req.get('host');
        product.product_img=host + '/' + product.product_img.split(path.sep).join('/')

        return res.status(200).json(product)
        })

    }
    catch(e){
        console.log(e)
        return res.status(500).json({ error: 'An error occurred while creating the product' });
    }
}

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const company_name = req.user.company_name;
    
        const product = await Product.findOne({ where: { id, ownerCompanyName: company_name } });
        if (!product) {
          return res.status(404).json({ error: 'Product not found or you do not have permission to update this product' });
        }

        if( product.is_deleted){
          return res.status(400).json({message: "Product not found!"})
        }
    
        const productData = {
          ...req.body,
        };
    
        if (req.files[0]) {
          const uploadedFile = req.files[0];
        // console.log(uploadedFile);
        const fileName = Date.now() + '_' + uploadedFile.originalname;
        
        const filePath = path.join('img', 'products', fileName);
        
        fs.writeFile(filePath, uploadedFile.buffer, async (err) => {
          if (err) {
            console.error('Error saving file:', err);
            return res.status(500).json({ error: 'An error occurred while saving the file' });
          }})
          productData.product_img = filePath;
        }

        if(productData.product_quantity>0){
          productData.is_active=true;
        }
    
        // Update the product
        await product.update(productData);

        const host = req.get('host');
        product.product_img=host + '/' + product.product_img.split(path.sep).join('/')
    
        return res.status(200).json(product);
      } catch (e) {
        console.log(e);
        return res.status(500).json({ error: 'An error occurred while updating the product' });
      }
    };

const delete_ = async (req, res) => {
    try {
      const { id } = req.params;
      const company_name = req.user.company_name;
  
      const product = await Product.findOne({ where: { id, ownerCompanyName: company_name } });
      if (!product) {
        return res.status(404).json({ error: 'Product not found or you do not have permission to delete this product' });
      }

      if(product.is_active == 0 || product.is_deleted){
        return res.status(400).json({message: "Product already deleted"})
      }
  
    product.is_active = false;
    product.is_deleted = Date.now()
    await product.save();
  
      return res.status(200).json({ message: `${product.product_name} has been deleted successfully` });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: 'An error occurred while deleting the product' });
    }
  };
  


module.exports = {
    add, update, delete_, read
  };