const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: false,
    },

    linkedService: {
      type: String,
      default: "swiftpay",
    },

    originalBankReference: {
      type: String,
      required: true,
      index: true,
    },

    destinationAccountNumber: {
      type: String,
      required: true,
    },

    destinationBank: {
      type: String,
      required: true,
    },

    destinationAccountName: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "successful",
        "failed",
        "reversed",
      ],
      default: "pending",
      index: true,
    },

    providerRef: {
      type: String,
      default: null,
      index: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    reversedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Refund", refundSchema);
