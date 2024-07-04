const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = model;

function model(sequelize) {
    const Owner = sequelize.define('Owner', {
        company_name: {
            type: DataTypes.STRING,
            allowNull: false,
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

// Test the connection and synchronize models with database
sequelize.authenticate()
.then(async () => {
    console.log('Connection has been established successfully.');

    // Synchronize models with database (create tables if not exists)
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

    return Owner;
}
