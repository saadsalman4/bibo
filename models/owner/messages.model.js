const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },

       
    );

Message.associate = function(models) {
    // Association for the sender of the message
    Message.belongsTo(models.Owner, {
        foreignKey: 'from',
        targetKey: 'company_name',
        as: 'sender'
    });

    // Association for the receiver of the message
    Message.belongsTo(models.Owner, {
        foreignKey: 'to',
        targetKey: 'company_name',
        as: 'receiver'
    });
};

    return Message;
}
