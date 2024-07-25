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
        from: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Owners',
                key: 'company_name',
            },
        },
        to: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Rooms',
                key: 'id',
            },
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    Message.associate = function(models) {
        Message.belongsTo(models.Owner, {
            foreignKey: 'from',
            as: 'sender',
        });

        Message.belongsTo(models.Room, {
            foreignKey: 'to',
            as: 'room',
        });
    };

    return Message;
}
