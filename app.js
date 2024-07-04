const express = require('express')
const app = express()
const port = 3000
const connect = require("./connect");
const ownerRoutes = require("./routes/owner.routes")

app.use(express.json())

app.use("/api/owner", ownerRoutes);

app.listen(port, () => console.log(`app listening at http://localhost:3000`))