
const dotenv = require("dotenv");
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || "development",

    // Shared with RexxPay Infra - must match exactly on both services.
    // Used to sign the webhook we fire when money lands on an Infra pool account.
    BANK_WEBHOOK_SECRET: process.env.BANK_WEBHOOK_SECRET,

    // Where RexxPay Infra's webhook receiver lives.
    REXXPAY_INFRA_WEBHOOK_URL:
        process.env.REXXPAY_INFRA_WEBHOOK_URL ||
        "https://checkout-rexxpay.onrender.com/api/webhooks/bank",

    // Required header (x-admin-key) to create pool accounts or use test-only routes.
    ADMIN_KEY: process.env.ADMIN_KEY
};
