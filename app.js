const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000
const connect = require("./connect");
const ownerRoutes = require("./routes/owner.routes")
const dotenv = require('dotenv');

app.use(express.json())
dotenv.config();

app.use("/api/owner", ownerRoutes);

app.listen(port, () => console.log(`app listening at http://localhost:3000`))