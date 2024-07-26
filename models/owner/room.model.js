const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const Room = sequelize.define('Room', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
          }
    },

       
    );

    Room.associate = function(models) {
        Room.hasMany(models.Message, {
          foreignKey: 'to',
          as: 'messages'
        });
        Room.hasMany(models.UserRoom, { foreignKey: 'roomId', as: 'participants' });
      };

    return Room;
}
