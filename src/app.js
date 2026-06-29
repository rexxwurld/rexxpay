const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser()); 

app.use(cors({
    origin: [
        "http://rexxpay.onrender.com",
    ],
    credentials: true 
}));



const authRoutes = require("./modules/auth/auth.routes");
const walletRoutes = require("./modules/wallet/wallet.routes");
const transactionRoutes = require("./modules/transaction/transaction.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/transaction", transactionRoutes);


app.get("/", (req, res) => {
    res.send("RexxPay API Running...");
});

module.exports = app;
