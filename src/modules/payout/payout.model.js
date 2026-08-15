// src/modules/payout/payout.model.js
//
// One row per payout instruction received from SwiftPay. idempotencyKey
// is SwiftPay's key - unique index means a retried instruction can
// never pay out twice.

const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
    {
        idempotencyKey: { type: String, required: true, unique: true },

        pool: { type: mongoose.Schema.Types.ObjectId, ref: "SettlementPool", required: true },
        sourceWallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },

        destinationAccountNumber: { type: String, required: true },
        destinationBank: { type: String, required: true },
        destinationAccountName: { type: String, default: "" },

        amount: { type: Number, required: true },
        currency: { type: String, default: "NGN" },

        status: {
            type: String,
            enum: ["pending", "success", "failed", "reversed"],
            default: "pending"
        },

        providerReference: { type: String, default: null },
        failureReason: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payout", payoutSchema);
