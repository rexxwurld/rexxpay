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

        // Payouts drain the pool's aggregate balance directly, not any one
        // customer's virtual account - there's no single wallet that "sent"
        // the money, so this is informational only (which pool account we
        // attributed the instruction to for reporting), never required and
        // never debited.
        sourceWallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", default: null },

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
