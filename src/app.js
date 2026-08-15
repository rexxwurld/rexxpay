const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// CORE MIDDLEWARE
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "https://rexxpay.onrender.com",
    credentials: true
}));


app.get("/health", (req, res) => {
    res.status(200).json({ status: true, message: "ok" });
});

const authRoutes = require("./modules/auth/auth.routes");
const walletRoutes = require("./modules/wallet/wallet.routes");
const transactionRoutes = require("./modules/transaction/transaction.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const depositRoutes = require("./modules/deposit/deposit.routes");
const payoutRoutes = require("./modules/payout/payout.routes");
const mockBankRoutes = require("./modules/bankPartner/mockBank.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/deposits", depositRoutes);
app.use("/api/v1/payouts", payoutRoutes);
// DEVELOPMENT/TESTING ONLY - simulates a bank transfer landing in RexxPay
// while there's no real NIBSS connection. Never expose this in production.
if (process.env.NODE_ENV !== "production") {
    app.use("/api/v1/mock-bank", mockBankRoutes);
}
// DEVELOPMENT/TESTING ONLY - block the simulator page + its JS in production,
// same guard as the API route below it.
if (process.env.NODE_ENV === "production") {
    app.get("/simulate-transfer.html", (req, res) => res.status(404).end());
    app.get("/assets/js/simulate-transfer.js", (req, res) => res.status(404).end());
}




app.use(express.static(path.join(__dirname, "public")));

app.get("/{*path}", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;
