const jwt = require('jsonwebtoken');
const {Owner_keys, Owner} = require('../connect');

const shopOwnerAuth = async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in!' });
  }

  try {

    const decoded = jwt.verify(token, process.env.SECRET_KEY); 
    req.user = decoded;

    const checkKey = await Owner_keys.findOne({ where: {jwt_key: token, tokenType: 'admin'}});
    if(!checkKey){
      return res.status(400).json({error: "Invalid token!"})
    }

    

    next();
  } catch (ex) {
    console.log(ex);
    res.status(400).json({ error: 'Not logged in as admin!' });
  }
};

module.exports = shopOwnerAuth;
