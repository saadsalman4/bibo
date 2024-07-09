const { DataTypes } = require('sequelize');
const { toDefaultValue } = require('sequelize/lib/utils');

module.exports = model;

function model(sequelize) {
    const Owner_purchase = sequelize.define('Owner_purchase', {
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
        purchase_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        
    }, 
       
    );

    Owner_purchase.associate = function(models) {
        Owner_purchase.belongsTo(models.Owner, {
        foreignKey: 'purchaser',
        targetKey: 'company_name',
        as: 'owner'
    });
};

    return Owner_purchase;
}
