const jwt = require('jsonwebtoken');
const { Owner_keys, Owner } = require('../connect');

const socketAuth = async (socket, next) => {
  const token = socket.handshake.query.token || socket.handshake.headers['x-auth-token'];

  if (!token) {
    return next(new Error('Not logged in!'));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    socket.user = decoded; // Attach decoded info to socket

    const checkKey = await Owner_keys.findOne({ where: { jwt_key: token, tokenType: 'access' } });
    if (!checkKey) {
      return next(new Error('Invalid token!'));
    }

    const owner = await Owner.findOne({ where: { company_name: decoded.company_name } });
    if (owner.is_blocked) {
      return next(new Error('User is blocked'));
    }

    next();
  } catch (ex) {
    console.log(ex);
    next(new Error('Not logged in as shop owner!'));
  }
};

module.exports = socketAuth;
