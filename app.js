const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000
const connect = require("./connect");
const ownerAuthRoutes = require("./routes/owner_auth.routes")
const productCRUDRoutes = require ("./routes/product.routes")
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const multer = require('multer')
const upload = multer()

// app.use(bodyParser.urlencoded({ extended: true })); // Parses urlencoded bodies
// app.use(bodyParser.json()); // Parses json bodies
app.use(upload.any())
app.use(express.json())

// app.use(upload.any())
app.use(cookieParser());
dotenv.config();

app.use("/api/owner", ownerAuthRoutes);
app.use("/api/owner/products", productCRUDRoutes)


app.listen(port, () => console.log(`app listening at http://localhost:3000`))