const mongoose = require("mongoose");
const axios = require("axios");
const Wallet = require("../wallet/wallet.model");
const Transaction = require("./transaction.model");
const { signPayload } = require("../../utils/webhookSignature");
const { REXXPAY_INFRA_WEBHOOK_URL } = require("../../config/env");

const transfer = async (
    senderId,
    receiverAccountNumber,
    amount,
    description,
    bank
) => {

    const session = await mongoose.startSession();

    let receiverWalletForWebhook = null;
    let webhookTransactionId = null;

    try {
        session.startTransaction();

        amount = Number(amount);

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

        const transaction = await Transaction.create([
            {
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

        await session.commitTransaction();
        session.endSession();

        // Remember these for the webhook, fired AFTER the DB transaction
        // has safely committed - never fire a webhook for money that
        // might still get rolled back.
        receiverWalletForWebhook = receiverWallet;
        webhookTransactionId = transaction[1]._id.toString();

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

        return transaction;

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
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
