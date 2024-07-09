const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = model;

function model(sequelize) {
    const Owner = sequelize.define('Owner', {
        company_name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        store_category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        company_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        postal_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ein_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        mobile_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        defaultScope: {
            // Exclude password hash by default
            attributes: { exclude: ['passwordHash'] },
        },
        scopes: {
            // Include hash with this scope
            withHash: { attributes: {}, },
        },
    });

Owner.associate = function(models) {
    Owner.hasMany(models.Product, {
        foreignKey: 'ownerCompanyName',
        sourceKey: 'company_name',
        as: 'products'
    });
};

Owner.associate = function(models) {
    Owner.hasMany(models.Owner_keys, {
        foreignKey: 'ownerCompanyName',
        sourceKey: 'company_name',
        as: 'owner_keys'
    });
};

Owner.associate = function(models) {
    Owner.hasMany(models.Owner_purchases, {
        foreignKey: 'purchaser',
        sourceKey: 'company_name',
        as: 'Owner_purchases'
    });
};

    return Owner;
}


