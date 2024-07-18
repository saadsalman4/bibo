const jwt = require('jsonwebtoken');
const {Owner_keys, Owner} = require('../connect');
const { access } = require('fs');

const shopOwnerAuth = async (req, res, next) => {
  const token = req.cookies.shopOwnerToken;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in!' });
  }

  try {

    const decoded = jwt.verify(token, process.env.SECRET_KEY); 
    req.user = decoded;

    const checkKey = await Owner_keys.findOne({ where: {jwt_key: token, tokenType: 'access'}});
    if(!checkKey){
      return res.status(400).json({error: "Invalid token!"})
    }
    const owner = await Owner.findOne({where: {email: decoded.email}})
    if(owner.is_blocked==true){
      return res.status(400).json({error: "User is blocked"})
    }

    

    next();
  } catch (ex) {
    console.log(ex);
    res.status(400).json({ error: 'Not logged in as shop owner!' });
  }
};

module.exports = shopOwnerAuth;
