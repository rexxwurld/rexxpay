const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");
const Wallet = require("../wallet/wallet.model");
const Transaction = require("./transaction.model");
const { signPayload } = require("../../utils/webhookSignature");
const { REXXPAY_INFRA_WEBHOOK_URL } = require("../../config/env");
const { postTransferEntries } = require("../ledger/ledger.service");
const auditLog = require("../audit/auditLog.service");
const limits = require("../../config/limits");

const transfer = async (
    senderId,
    receiverAccountNumber,
    amount,
    description,
    bank,
    idempotencyKey = null
) => {

    amount = Number(amount);

    // Idempotency: if the client already sent this exact request (retry
    // after a timeout, double-tap on "send") and we have a matching key on
    // record, return the original result instead of transferring again.
    if (idempotencyKey) {
        const existing = await Transaction.findOne({ idempotencyKey, sender: senderId, type: "debit" });
        if (existing) return { duplicate: true, transactions: [existing] };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid transfer amount");
    }
    if (amount > limits.MAX_SINGLE_TRANSFER) {
        throw new Error(`Transfer exceeds the maximum single transfer limit of ${limits.MAX_SINGLE_TRANSFER}`);
    }

    const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [dailyAgg] = await Transaction.aggregate([
        { $match: { sender: senderId, type: "debit", status: "success", createdAt: { $gte: dayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const dailyTotal = (dailyAgg?.total || 0) + amount;
    if (dailyTotal > limits.MAX_DAILY_OUTBOUND) {
        await auditLog.record({
            actorType: "user",
            actorRef: senderId.toString(),
            action: "transfer.blocked_daily_limit",
            severity: "warning",
            metadata: { amount, dailyTotal }
        });
        throw new Error(`Transfer would exceed your daily outbound limit of ${limits.MAX_DAILY_OUTBOUND}`);
    }

    const session = await mongoose.startSession();

    let receiverWalletForWebhook = null;
    let webhookTransactionId = null;
    let transaction;

    try {
        session.startTransaction();

        const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);

        if (!senderWallet) throw new Error("Sender wallet not found");

        if (senderWallet.balance < amount) {
            throw new Error("Insufficient balance");
        }

        const receiverWallet = await Wallet.findOne({
            accountNumber: receiverAccountNumber
        }).session(session);

        if (!receiverWallet) throw new Error("Sending to other banks not allowed");

        if (senderWallet.accountNumber === receiverWallet.accountNumber) {
            throw new Error("Cannot transfer to self");
        }

        senderWallet.balance -= amount;
        await senderWallet.save({ session });

        receiverWallet.balance += amount;
        await receiverWallet.save({ session });

        const effectiveKey = idempotencyKey || `auto_${crypto.randomBytes(12).toString("hex")}`;

        transaction = await Transaction.create([
            {
                idempotencyKey: effectiveKey,
                sender: senderId,
                receiver: receiverWallet.userId,
                amount,
                description,
                bank,
                accountNumber: receiverAccountNumber,
                type: "debit",
                status: "success"
            },
            {
                sender: senderId,
                receiver: receiverWallet.userId,
                amount,
                description,
                bank,
                accountNumber: receiverAccountNumber,
                type: "credit",
                status: "success"
            }
        ], { session, ordered: true });

        // Ledger: the source of truth behind the two Wallet.balance writes
        // above - lets any balance be independently rebuilt from history.
        await postTransferEntries({
            entryGroup: `txn_${transaction[0]._id}`,
            amount,
            senderWalletId: senderWallet._id,
            receiverWalletId: receiverWallet._id,
            sourceRef: transaction[0]._id.toString(),
            session
        });

        await session.commitTransaction();
        session.endSession();

        // Remember these for the webhook, fired AFTER the DB transaction
        // has safely committed - never fire a webhook for money that
        // might still get rolled back.
        receiverWalletForWebhook = receiverWallet;
        webhookTransactionId = transaction[1]._id.toString();

        await auditLog.record({
            actorType: "user",
            actorRef: senderId.toString(),
            action: "transfer.completed",
            entityType: "Transaction",
            entityRef: transaction[0]._id.toString(),
            metadata: { amount, receiverAccountNumber }
        });

        // ================= NOTIFY REXXPAY INFRA ================= //
        // If this transfer landed on a wallet flagged as belonging to
        // Infra's account pool, tell Infra so it can mark the matching
        // order/transaction as paid. This is fire-and-forget from the
        // sender's point of view - their transfer already succeeded
        // regardless of whether Infra is reachable right now.
        if (receiverWalletForWebhook.linkedService === "rexxpay_infra") {
            notifyInfra({
                accountNumber: receiverWalletForWebhook.accountNumber,
                // Infra/Elite Aura track amounts in kobo (minor units).
                // RexxPay Bank wallet balances are in whole Naira, so we
                // convert here. If that assumption is wrong for your
                // setup, adjust this multiplier.
                amountReceived: Math.round(amount * 100),
                currency: "NGN",
                bankReference: `rxpbank_${webhookTransactionId}`
            }).catch((err) => {
                console.error("[webhook] failed to notify RexxPay Infra:", err.message);
            });
        }

        return { duplicate: false, transactions: transaction };

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        // A concurrent retry with the same idempotency key can race past
        // the findOne check above - the unique index is the real guarantee.
        if (err.code === 11000 && idempotencyKey) {
            const existingRace = await Transaction.findOne({ idempotencyKey, sender: senderId, type: "debit" });
            if (existingRace) return { duplicate: true, transactions: [existingRace] };
        }
        throw err;
    }
};

async function notifyInfra(payload) {
    const signature = signPayload(payload);

    await axios.post(REXXPAY_INFRA_WEBHOOK_URL, payload, {
        headers: {
            "x-bank-signature": signature,
            "Content-Type": "application/json"
        },
        timeout: 15000
    });
}

// GET USER TRANSACTIONS
const getUserTransactions = async (userId) => {

    const transactions = await Transaction.find({
        $or: [
            { sender: userId, type: "debit" },   // ← sender only sees debit
            { receiver: userId, type: "credit" }  // ← receiver only sees credit
        ]
    })
    .sort({ createdAt: -1 })
    .populate("sender", "fullname email")
    .populate("receiver", "fullname email");

    return transactions.map(tx => {

        let direction = "unknown";

        if (tx.type === "debit") direction = "sent";
        if (tx.type === "credit") direction = "received";

        return {
            _id: tx._id,
            amount: tx.amount,
            description: tx.description,
            type: tx.type,
            status: tx.status,
            direction,
            bank: tx.bank,
            accountNumber: tx.accountNumber,
            sender: tx.sender,
            receiver: tx.receiver,
            createdAt: tx.createdAt
        };
    });
};

module.exports = {
    transfer,
    getUserTransactions
};
