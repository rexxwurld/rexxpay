// src/modules/refund/refund.service.js
//
// Bank-side refund instructions received from SwiftPay. A refund drains
// the linked service's settlement pool, just like a payout, but the bank
// outcome is asynchronous: acceptance here means "instruction queued",
// not "customer received the money".

const mongoose = require("mongoose");
const crypto = require("crypto");
const Refund = require("./refund.model");
const SettlementPool = require("../settlement/settlementPool.model");
const { postPoolEntry } = require("../ledger/poolLedger.service");
const { getPoolByService, debitPool, creditPool } = require("../settlement/settlementPool.service");
const auditLog = require("../audit/auditLog.service");

function generateRefundReference() {
    return `rf_${crypto.randomBytes(12).toString("hex")}`;
}

async function processRefund({
    idempotencyKey,
    linkedService = "swiftpay",
    originalBankReference,
    destinationAccountNumber,
    destinationBank,
    destinationAccountName = "",
    amount,
    currency = "NGN"
}) {
    amount = Number(amount);

    if (!idempotencyKey) throw new Error("idempotencyKey_required");
    if (!originalBankReference) throw new Error("original_bank_reference_required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalid_refund_amount");
    if (!destinationAccountNumber || !destinationBank) throw new Error("destination_required");

    const existing = await Refund.findOne({ idempotencyKey });
    if (existing) return { duplicate: true, refund: existing };

    const pool = await getPoolByService(linkedService);
    if (!pool) throw new Error("settlement_pool_not_found");

    const session = await mongoose.startSession();
    let refund;

    try {
        session.startTransaction();

        const freshPool = await SettlementPool.findById(pool._id).session(session);
        if (!freshPool) throw new Error("settlement_pool_not_found");
        if (freshPool.poolBalance < amount) throw new Error("insufficient_pool_funds");

        [refund] = await Refund.create([{
            idempotencyKey,
            reference: generateRefundReference(),
            pool: pool._id,
            linkedService,
            originalBankReference,
            destinationAccountNumber,
            destinationBank,
            destinationAccountName,
            amount,
            currency,
            status: "pending"
        }], { session, ordered: true });

        // Reserve the real bank-held funds in the settlement pool.
        await postPoolEntry({
            pool: pool._id,
            direction: "debit",
            amount,
            sourceType: "refund",
            sourceRef: refund._id.toString(),
            description: `Refund to ${destinationAccountNumber}`,
            session
        });
        await debitPool(pool._id, amount, session);

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        if (err.code === 11000) {
            const raced = await Refund.findOne({ idempotencyKey });
            if (raced) return { duplicate: true, refund: raced };
        }
        throw err;
    }

    try {
        // Replace this stub with the actual bank/provider submission.
        // A successful return means only that the instruction was accepted.
        const providerReference = await sendToDestinationBank(refund);

        refund.status = "processing";
        refund.providerRef = providerReference;
        refund.failureReason = null;
        await refund.save();

        await auditLog.record({
            actorType: "system",
            actorRef: "refund_processor",
            action: "refund.submitted",
            entityType: "Refund",
            entityRef: refund._id.toString(),
            metadata: { providerReference, amount, destinationAccountNumber }
        });
    } catch (err) {
        // The stub/provider explicitly failed before accepting the instruction,
        // so the reserved pool funds can safely be returned. Network ambiguity
        // must NOT be auto-reversed in a real provider integration.
        await reverseRefund(refund, err.message);
    }

    return { duplicate: false, refund };
}

async function sendToDestinationBank(refund) {
    return `stub_ref_${refund._id.toString()}`;
}

async function reverseRefund(refund, reason) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await postPoolEntry({
            pool: refund.pool,
            direction: "credit",
            amount: refund.amount,
            sourceType: "reversal",
            sourceRef: `${refund._id.toString()}_reversal`,
            description: `Refund reversal: ${reason}`,
            session
        });

        const poolId = refund.pool;
        await creditPool(poolId, refund.amount, session);

        refund.status = "failed";
        refund.failureReason = reason;
        refund.reversedAt = new Date();
        await refund.save({ session });

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }

    return refund;
}

async function getRefundByReference(reference) {
    return Refund.findOne({ reference });
}

module.exports = { processRefund, getRefundByReference };
