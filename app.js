const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const path = require('path')

const http = require('http');
const server = http.createServer(app);

const chat = require('./chat')
chat(server);

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/views/index.html');
//   });

const port = 3000
const connect = require("./connect");
const session = require('express-session');
const flash = require('connect-flash');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/img/products', express.static(path.join(__dirname, 'img/products')));

const ownerAuthRoutes = require("./routes/owner_auth.routes")
const productCRUDRoutes = require ("./routes/product.routes")
const ownerPurchaseRoutes = require("./routes/owner_purchases.routes")
const accountManagementRoutes = require('./routes/account_management.routes')
const adminOperationRoutes = require('./routes/admin_operations.routes')
const chatRoutes = require('./routes/chat.routes')

const dotenv = require('dotenv');
dotenv.config();

app.use(session({
    secret: process.env.session_token,
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());
app.use(require('express-flash')());


const cookieParser = require('cookie-parser');

const multer = require('multer')
const upload = multer()

app.use(upload.any())
app.use(express.json())


app.use(cookieParser());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/api/owner", ownerAuthRoutes);
app.use("/api/owner/products", productCRUDRoutes)
app.use("/api/owner/purchase", ownerPurchaseRoutes)
app.use("/api/account", accountManagementRoutes)
app.use("/api/admin", adminOperationRoutes)
app.use("/api/chat", chatRoutes)



// app.listen(port, () => console.log(`app listening at http://localhost:3000`))
server.listen(3000, () => {
    console.log('listening on *:3000');
  });