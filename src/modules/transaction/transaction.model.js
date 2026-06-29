const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    bank: {
        type: String,
        default: ""
    },
    accountNumber: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        enum: ["transfer", "credit", "debit"],
        default: "transfer"
    },
    status: {
        type: String,
        enum: ["success", "failed", "pending"],
        default: "success"
    }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);