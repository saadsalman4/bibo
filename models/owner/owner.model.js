const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        company_name: {type: DataTypes.STRING, allowNull: false},
        store_category: {type: DataTypes.STRING, allowNull: false},
        company_address: {type: DataTypes.STRING, allowNull: false},
        city: {type: DataTypes.STRING, allowNull: false},
        postal_code: {type: DataTypes.INTEGER, allowNull: false},
        state: {type: DataTypes.STRING, allowNull: false},
        country: {type: DataTypes.STRING, allowNull: false},
        ein_number: {type: DataTypes.INTEGER, allowNull: false},
        email: { type: DataTypes.STRING, allowNull: false },
        mobile_number: {type: DataTypes.INTEGER, allowNull: false},
        passwordHash: { type: DataTypes.STRING, allowNull: false },
    };

    const options = {
        defaultScope: {
            // exclude password hash by default
            attributes: { exclude: ['passwordHash'] }
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {}, }
        }
    };

    return sequelize.define('Owner', attributes, options);
}