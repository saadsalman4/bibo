const { DataTypes } = require('sequelize');
const { toDefaultValue } = require('sequelize/lib/utils');

module.exports = model;

function model(sequelize) {
    const Product = sequelize.define('Product', {
        product_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        product_img: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true // Default value for is_active
        },
        
    }, 
       
    );

Product.associate = function(models) {
    Product.belongsTo(models.Owner, {
        foreignKey: 'ownerCompanyName',
        targetKey: 'company_name',
        as: 'owner'
    });
};

    return Product;
}
