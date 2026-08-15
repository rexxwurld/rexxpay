const dotenv = require("dotenv");
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || "development",

    // Shared with SwiftPay - must match exactly on both services.
    // Used to sign outgoing webhooks (deposit notifications) AND to verify
    // incoming requests from SwiftPay (payout instructions). Same secret,
    // both directions.
    SWIFTPAY_WEBHOOK_SECRET: process.env.SWIFTPAY_WEBHOOK_SECRET || process.env.BANK_WEBHOOK_SECRET,

    // Where SwiftPay's webhook receiver lives (deposit notifications go here).
    SWIFTPAY_WEBHOOK_URL:
        process.env.SWIFTPAY_WEBHOOK_URL ||
        process.env.REXXPAY_INFRA_WEBHOOK_URL ||
        "https://checkout-rexxpay.onrender.com/api/webhooks/bank",

    // Required header (x-admin-key) to create pool accounts or use test-only routes.
    ADMIN_KEY: process.env.ADMIN_KEY
};
