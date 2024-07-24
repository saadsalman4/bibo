const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('bibo', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

const Owner = require('./models/owner/owner.model')(sequelize);
const Product = require('./models/owner/product.model')(sequelize);
const Owner_keys = require('./models/owner/owner_keys.model')(sequelize);
const Owner_purchases = require('./models/owner/owner_purchases.model')(sequelize);
const Owner_OTPS = require('./models/owner/owner_otps.model')(sequelize);
const Message = require('./models/owner/messages.model')(sequelize);
const Room = require('./models/owner/room.model')(sequelize);
const UserRoom = require('./models/owner/user_room.model')(sequelize);

const db = {
  sequelize,
  Owner,
  Product,
  Owner_keys,
  Owner_purchases,
  Owner_OTPS,
  Message,
  Room,
  UserRoom
};

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}); 


sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(error => console.log('This error occurred:', error));

  module.exports = db;
