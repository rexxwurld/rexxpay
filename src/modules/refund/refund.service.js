const crypto = require("crypto");
const Refund = require("./refund.model");

function generateRefundReference() {
  return `rf_${crypto.randomBytes(12).toString("hex")}`;
}

async function createRefund(data) {
  const {
    idempotencyKey,
    linkedService = "swiftpay",
    originalBankReference,
    destinationAccountNumber,
    destinationBank,
    destinationAccountName,
    amount,
    currency = "NGN",
    merchant,
  } = data;

  if (!idempotencyKey) {
    throw new Error("idempotencyKey is required");
  }

  if (!originalBankReference) {
    throw new Error("originalBankReference is required");
  }

  if (!destinationAccountNumber) {
    throw new Error("destinationAccountNumber is required");
  }

  if (!destinationBank) {
    throw new Error("destinationBank is required");
  }

  if (!amount || amount <= 0) {
    throw new Error("amount must be greater than zero");
  }

  // Idempotency: never create the same refund twice.
  const existingRefund = await Refund.findOne({ idempotencyKey });

  if (existingRefund) {
    return existingRefund;
  }

  const refund = await Refund.create({
    idempotencyKey,
    reference: generateRefundReference(),
    merchant,
    linkedService,
    originalBankReference,
    destinationAccountNumber,
    destinationBank,
    destinationAccountName,
    amount,
    currency,
    status: "pending",
  });

  return refund;
}

async function getRefundByReference(reference) {
  return Refund.findOne({ reference });
}

async function getRefundByIdempotencyKey(idempotencyKey) {
  return Refund.findOne({ idempotencyKey });
}

async function processRefund(reference) {
  const refund = await Refund.findOne({ reference });

  if (!refund) {
    throw new Error("Refund not found");
  }

  if (refund.status === "successful") {
    return refund;
  }

  refund.status = "processing";
  await refund.save();

  return refund;
}

async function markRefundSuccessful(reference, providerRef = null) {
  const refund = await Refund.findOne({ reference });

  if (!refund) {
    throw new Error("Refund not found");
  }

  refund.status = "successful";
  refund.providerRef = providerRef;
  refund.failureReason = null;
  refund.processedAt = new Date();

  await refund.save();

  return refund;
}

async function markRefundFailed(reference, reason) {
  const refund = await Refund.findOne({ reference });

  if (!refund) {
    throw new Error("Refund not found");
  }

  refund.status = "failed";
  refund.failureReason = reason || "Refund failed";

  await refund.save();

  return refund;
}

async function markRefundReversed(reference, reason = null) {
  const refund = await Refund.findOne({ reference });

  if (!refund) {
    throw new Error("Refund not found");
  }

  refund.status = "reversed";
  refund.failureReason = reason;
  refund.reversedAt = new Date();

  await refund.save();

  return refund;
}

module.exports = {
  createRefund,
  getRefundByReference,
  getRefundByIdempotencyKey,
  processRefund,
  markRefundSuccessful,
  markRefundFailed,
  markRefundReversed,
};
