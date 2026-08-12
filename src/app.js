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


// Lightweight health check - used by an external uptime pinger (cron)
// to keep this instance from going idle/asleep on Render's free tier.
// No auth needed: it returns no sensitive data, just confirms the
// process is up and responding.
app.get("/health", (req, res) => {
    res.status(200).json({ status: true, message: "ok" });
});

const authRoutes = require("./modules/auth/auth.routes");
const walletRoutes = require("./modules/wallet/wallet.routes");
const transactionRoutes = require("./modules/transaction/transaction.routes");
const adminRoutes = require("./modules/admin/admin.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/admin", adminRoutes);


app.use(express.static(path.join(__dirname, "public")));

app.get("/{*path}", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;
