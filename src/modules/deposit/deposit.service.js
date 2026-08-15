// src/modules/deposit/deposit.service.js
//
// This is where a real deposit-detection webhook (from your banking rail
// / NIBSS / provider) should eventually call in. For now it's exposed
// through an admin-key-protected route so you can trigger and test the
// full flow before a real provider is wired up - see deposit.controller.js.

const mongoose = require("mongoose");
const axios = require("axios");
const Wallet = require("../wallet/wallet.model");
const Deposit = require("./deposit.model");
const { postSingleEntry } = require("../ledger/ledger.service");
const { postPoolEntry } = require("../ledger/poolLedger.service");
const { creditPool } = require("../settlement/settlementPool.service");
const { signPayload } = require("../../utils/webhookSignature");
const { SWIFTPAY_WEBHOOK_URL } = require("../../config/env");
const auditLog = require("../audit/auditLog.service");

async function processDeposit({ accountNumber, amount, reference, rawPayload = null }) {
    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("invalid_deposit_amount");
    }

    const existing = await Deposit.findOne({ reference });
    if (existing) return { duplicate: true, deposit: existing };

    const session = await mongoose.startSession();
    let deposit;
    let walletForWebhook;

    try {
        session.startTransaction();

        const wallet = await Wallet.findOne({ accountNumber }).session(session);
        if (!wallet) throw new Error("destination_wallet_not_found");
        if (!wallet.pool) throw new Error("wallet_not_linked_to_a_settlement_pool");

        wallet.balance += amount;
        await wallet.save({ session });

        [deposit] = await Deposit.create(
            [{ reference, wallet: wallet._id, pool: wallet.pool, amount, status: "confirmed", rawPayload }],
            { session, ordered: true }
        );

        await postSingleEntry({
            wallet: wallet._id,
            direction: "credit",
            amount,
            sourceType: "deposit",
            sourceRef: deposit._id.toString(),
            description: "External deposit",
            session
        });

        await postPoolEntry({
            pool: wallet.pool,
            direction: "credit",
            amount,
            sourceType: "deposit",
            sourceRef: deposit._id.toString(),
            description: `Deposit to ${accountNumber}`,
            session
        });
        await creditPool(wallet.pool, amount, session);

        await session.commitTransaction();
        session.endSession();

        walletForWebhook = wallet;

        await auditLog.record({
            actorType: "system",
            actorRef: "deposit_processor",
            action: "deposit.confirmed",
            entityType: "Deposit",
            entityRef: deposit._id.toString(),
            metadata: { amount, accountNumber, reference }
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        if (err.code === 11000) {
            const raced = await Deposit.findOne({ reference });
            if (raced) return { duplicate: true, deposit: raced };
        }
        throw err;
    }

    if (walletForWebhook.linkedService === "swiftpay") {
        notifySwiftPay({
            accountNumber,
            amountReceived: Math.round(amount * 100), // SwiftPay tracks kobo
            currency: "NGN",
            bankReference: `rxpbank_${deposit._id.toString()}`,
            depositReference: reference
        }).catch((err) => {
            console.error("[webhook] failed to notify SwiftPay of deposit:", err.message);
        });
    }

    return { duplicate: false, deposit };
}

async function notifySwiftPay(payload) {
    const signature = signPayload(payload);
    await axios.post(SWIFTPAY_WEBHOOK_URL, payload, {
        headers: { "x-bank-signature": signature, "Content-Type": "application/json" },
        timeout: 15000
    });
}

module.exports = { processDeposit };
