const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    accountNumber: {
        type: String,
        required: true,
        unique: true
    },

    balance: {
        type: Number,
        default: 0
    },

    // null = a normal end-user wallet.
    // "rexxpay_infra" = a pool account created for RexxPay Infra; transfers
    // landing here fire a webhook to Infra instead of just sitting as a
    // normal balance.
    linkedService: {
        type: String,
        enum: [null, "rexxpay_infra"],
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);
