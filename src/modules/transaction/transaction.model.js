const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    // Client-supplied (or auto-generated) key so a retried "transfer"
    // request - e.g. the user double-tapping "send" on a slow connection -
    // can never create two real transfers. Sparse so old rows without one
    // don't collide.
    idempotencyKey: {
        type: String,
        default: null
    },
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

transactionSchema.index(
    { idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

module.exports = mongoose.model("Transaction", transactionSchema);