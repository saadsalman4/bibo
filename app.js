const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000
const connect = require("./connect");
const ownerRoutes = require("./routes/owner_auth.routes")
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

app.use(express.json())
app.use(cookieParser());
dotenv.config();

app.use("/api/owner", ownerRoutes);

app.listen(port, () => console.log(`app listening at http://localhost:3000`))