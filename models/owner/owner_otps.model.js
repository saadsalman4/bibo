const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const Owner_OTPS = sequelize.define('Owner_OTP', {
        otp: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        otp_expiry: {
            type: DataTypes.DATE,
            allowNull: true
        },
    },

       
    );

Owner_OTPS.associate = function(models) {
    Owner_OTPS.belongsTo(models.Owner, {
        foreignKey: 'ownerEmail',
        targetKey: 'email',
        as: 'owner'
    });
};

    return Owner_OTPS;
}
