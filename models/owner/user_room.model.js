const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const UserRoom = sequelize.define('UserRoom', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Owners',
                key: 'company_name'
            }
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Rooms',
                key: 'id'
            }
        },
        blocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    UserRoom.associate = function(models) {
        UserRoom.belongsTo(models.Owner, {
            foreignKey: 'username',
            as: 'user'
        });

        UserRoom.belongsTo(models.Room, {
            foreignKey: 'roomId',
            as: 'room'
        });
    };

    return UserRoom;
}
