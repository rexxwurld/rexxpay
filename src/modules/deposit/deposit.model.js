// src/modules/deposit/deposit.model.js
//
// One row per external deposit landing on a Wallet (virtual account).
// `reference` is whatever unique ID the money-in event carries - the
// unique index on it is what makes deposit processing idempotent.

const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
    {
        reference: { type: String, required: true, unique: true },

        wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
        pool: { type: mongoose.Schema.Types.ObjectId, ref: "SettlementPool", required: true },

        amount: { type: Number, required: true },
        currency: { type: String, default: "NGN" },

        status: {
            type: String,
            enum: ["pending", "confirmed", "failed"],
            default: "pending"
        },

        rawPayload: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Deposit", depositSchema);
