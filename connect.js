const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('bibo', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

const OwnerModel = require('./models/owner/owner.model')(sequelize, DataTypes);

module.exports = {
  sequelize,
  Owner: OwnerModel,
};
