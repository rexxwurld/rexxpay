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
    // "swiftpay" = a pool account created for SwiftPay; transfers landing
    // here fire a webhook to SwiftPay instead of just sitting as a normal
    // balance.
    linkedService: {
        type: String,
        enum: [null, "swiftpay"],
        default: null
    },

    // Which SettlementPool this wallet's real funds sit in. Set for
    // swiftpay-linked wallets (and, going forward, any wallet whose
    // deposits should count toward a pool rather than being fully
    // self-contained). Null for plain end-user wallets with no pool backing.
    pool: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SettlementPool",
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);
