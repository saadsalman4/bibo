const jwt = require('jsonwebtoken');

const shopOwnerAuth = (req, res, next) => {
  const token = req.cookies.shopOwnerToken;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY); 
    req.user = decoded;

    next();
  } catch (ex) {
    res.status(400).json({ error: 'Not logged in as shop owner!' });
  }
};

module.exports = shopOwnerAuth;
