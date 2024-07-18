const { DataTypes } = require('sequelize');

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
        },
        company_address: {
            type: DataTypes.STRING,
        },
        city: {
            type: DataTypes.STRING,
        },
        postal_code: {
            type: DataTypes.STRING,
        },
        state: {
            type: DataTypes.STRING,
        },
        country: {
            type: DataTypes.STRING,
        },
        ein_number: {
            type: DataTypes.STRING,
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
            unique: true,
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        otp_verified : {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        user_role :{
            type: DataTypes.ENUM('owner', 'admin'),
            allowNull:false
        }
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

Owner.associate = function(models) {
    Owner.hasMany(models.Owner_OTPS, {
        foreignKey: 'ownerEmail',
        sourceKey: 'email',
        as: 'Owner_OTPS'
    });
};

    return Owner;
}


