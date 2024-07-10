const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000
const connect = require("./connect");

const ownerAuthRoutes = require("./routes/owner_auth.routes")
const productCRUDRoutes = require ("./routes/product.routes")
const ownerPurchaseRoutes = require("./routes/owner_purchases.routes")
const accountManagementRoutes = require('./routes/account_management.routes')

const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path')
const multer = require('multer')
const upload = multer()

app.use(upload.any())
app.use(express.json())
app.use('/img/products', express.static(path.join(__dirname, 'img/products')));

app.use(cookieParser());
dotenv.config();

app.use("/api/owner", ownerAuthRoutes);
app.use("/api/owner/products", productCRUDRoutes)
app.use("/api/owner/purchase", ownerPurchaseRoutes)
app.use("/api/account", accountManagementRoutes)


app.listen(port, () => console.log(`app listening at http://localhost:3000`))