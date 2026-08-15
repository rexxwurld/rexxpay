// src/modules/payout/payout.service.js
//
// Receives a payout instruction from SwiftPay and moves real funds out
// of the settlement pool. The actual "send money to destination bank"
// step is stubbed (see sendToDestinationBank) until you wire up a real
// outbound-transfer provider.

const mongoose = require("mongoose");
const Wallet = require("../wallet/wallet.model");
const Payout = require("./payout.model");
const { postSingleEntry } = require("../ledger/ledger.service");
const { postPoolEntry } = require("../ledger/poolLedger.service");
const { getPoolByService, debitPool, creditPool } = require("../settlement/settlementPool.service");
const auditLog = require("../audit/auditLog.service");

async function processPayout({
    idempotencyKey,
    linkedService,
    destinationAccountNumber,
    destinationBank,
    destinationAccountName = "",
    amount
}) {
    amount = Number(amount);

    if (!idempotencyKey) throw new Error("idempotencyKey_required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalid_payout_amount");
    if (!destinationAccountNumber || !destinationBank) throw new Error("destination_required");

    const existing = await Payout.findOne({ idempotencyKey });
    if (existing) return { duplicate: true, payout: existing };

    const pool = await getPoolByService(linkedService);
    if (!pool) throw new Error("settlement_pool_not_found");

    const poolWallet = await Wallet.findOne({ pool: pool._id, linkedService });
    if (!poolWallet) throw new Error("pool_wallet_not_found");

    const session = await mongoose.startSession();
    let payout;

    try {
        session.startTransaction();

        const freshWallet = await Wallet.findById(poolWallet._id).session(session);
        if (freshWallet.balance < amount) {
            throw new Error("insufficient_pool_funds");
        }

        [payout] = await Payout.create(
            [{
                idempotencyKey,
                pool: pool._id,
                sourceWallet: freshWallet._id,
                destinationAccountNumber,
                destinationBank,
                destinationAccountName,
                amount,
                status: "pending"
            }],
            { session, ordered: true }
        );

        freshWallet.balance -= amount;
        await freshWallet.save({ session });

        await postSingleEntry({
            wallet: freshWallet._id,
            direction: "debit",
            amount,
            sourceType: "payout",
            sourceRef: payout._id.toString(),
            description: `Payout to ${destinationAccountNumber}`,
            session
        });

        await postPoolEntry({
            pool: pool._id,
            direction: "debit",
            amount,
            sourceType: "payout",
            sourceRef: payout._id.toString(),
            description: `Payout to ${destinationAccountNumber}`,
            session
        });
        await debitPool(pool._id, amount, session);

        await session.commitTransaction();
        session.endSession();

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        if (err.code === 11000) {
            const raced = await Payout.findOne({ idempotencyKey });
            if (raced) return { duplicate: true, payout: raced };
        }
        throw err;
    }

    try {
        const providerReference = await sendToDestinationBank(payout);

        payout.status = "success";
        payout.providerReference = providerReference;
        await payout.save();

        await auditLog.record({
            actorType: "system",
            actorRef: "payout_processor",
            action: "payout.success",
            entityType: "Payout",
            entityRef: payout._id.toString(),
            metadata: { amount, destinationAccountNumber }
        });

    } catch (sendErr) {
        await reversePayout(payout, sendErr.message);
    }

    return { duplicate: false, payout };
}

// STUB: replace with a real call to your outbound-transfer provider.
// Must throw on failure so processPayout's catch block reverses funds.
async function sendToDestinationBank(payout) {
    return `stub_ref_${payout._id.toString()}`;
}

async function reversePayout(payout, reason) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const wallet = await Wallet.findById(payout.sourceWallet).session(session);
        wallet.balance += payout.amount;
        await wallet.save({ session });

        await postSingleEntry({
            wallet: wallet._id,
            direction: "credit",
            amount: payout.amount,
            sourceType: "payout",
            sourceRef: `${payout._id.toString()}_reversal`,
            description: `Payout reversal: ${reason}`,
            session
        });

        await postPoolEntry({
            pool: payout.pool,
            direction: "credit",
            amount: payout.amount,
            sourceType: "reversal",
            sourceRef: `${payout._id.toString()}_reversal`,
            description: `Payout reversal: ${reason}`,
            session
        });
        await creditPool(payout.pool, payout.amount, session);

        payout.status = "failed";
        payout.failureReason = reason;
        await payout.save({ session });

        await session.commitTransaction();
        session.endSession();

        await auditLog.record({
            actorType: "system",
            actorRef: "payout_processor",
            action: "payout.reversed",
            entityType: "Payout",
            entityRef: payout._id.toString(),
            severity: "warning",
            metadata: { reason }
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = { processPayout };
