const path = require('path')
const { sequelize, Owner_purchases, Product } = require('../connect');

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


        const protocol = req.protocol;
        const host = req.get('host');
        product.product_img=protocol + '://'+ host + '/' + product.product_img.split(path.sep).join('/')

        return res.status(200).json(product);
    }
    catch(e){
        console.log(e);
        return res.status(500).json({ error: 'An error occurred while fetching the product' });
    }
}

async function purchaseItem (req, res){
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
        const transaction = await sequelize.transaction();

        await Owner_purchases.create(newPurchase, { transaction });
        await product.save({ transaction });

        await transaction.commit();

        const protocol = req.protocol;
        const host = req.get('host');
        newPurchase.product_img=protocol + '://'+ host + '/' + newPurchase.product_img.split(path.sep).join('/')

        return res.status(200).json(newPurchase)
    }
    catch(e){
        console.log(e)
        await transaction.rollback();
        return res.status(400).json("Error making purchase!")

    }
}

async function viewHistory (req, res){
    try{
        const company_name = req.user.company_name

        const purchases = await Owner_purchases.findAll({where: {purchaser: company_name}});

        if(purchases.length == 0){
            return res.status(200).json(purchases)
        }

        const host = req.get('host');
        const protocol = req.protocol;

        const purchasesWithURL = purchases.map(purchase => {
            return {
              ...purchase.toJSON(),
              product_img: protocol + '://'+ host + '/' + purchase.product_img.split(path.sep).join('/')
            };
          });

        return res.status(200).json(purchasesWithURL)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("Error")
    }

}

module.exports = {viewListing, purchaseItem, viewHistory}