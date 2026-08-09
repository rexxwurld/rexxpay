// src/config/limits.js
// Flat limits for demonstration - a real product tiers these by KYC level.
module.exports = {
    MAX_SINGLE_TRANSFER: Number(process.env.MAX_SINGLE_TRANSFER || 500000), // ₦500,000
    MAX_DAILY_OUTBOUND: Number(process.env.MAX_DAILY_OUTBOUND || 2000000) // ₦2,000,000
};
