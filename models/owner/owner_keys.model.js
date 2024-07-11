const { DataTypes } = require('sequelize');
const { toDefaultValue } = require('sequelize/lib/utils');

module.exports = model;

function model(sequelize) {
    const Owner_keys = sequelize.define('OwnerKey', {
        jwt_key: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        } ,
        accessToken:{
            type: DataTypes.BOOLEAN,
        },
        resetToken:{
            type: DataTypes.BOOLEAN,
        },
    },

       
    );

Owner_keys.associate = function(models) {
    Owner_keys.belongsTo(models.Owner, {
        foreignKey: 'ownerCompanyName',
        targetKey: 'company_name',
        as: 'owner'
    });
};

    return Owner_keys;
}
