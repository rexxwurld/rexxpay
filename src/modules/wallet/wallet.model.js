const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({

    // Required for normal end-user wallets. Left null for pool/virtual
    // accounts (linkedService: "swiftpay") - those aren't owned by any
    // real person, so there's no user to reference.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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

    // Only meaningful for linkedService: "swiftpay" pool wallets.
    // available: free for SwiftPay to hand out to a customer.
    // assigned:  currently in use for an active checkout on SwiftPay's side.
    // SwiftPay is the source of truth for WHEN this flips (it owns the
    // checkout lifecycle) - this field just mirrors that so the bank's
    // own records/dashboard agree with SwiftPay's pool state.
    status: {
        type: String,
        enum: ["available", "assigned"],
        default: "available"
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
