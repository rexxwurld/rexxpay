const mongoose = require("mongoose");
const Wallet = require("../wallet/wallet.model");
const Transaction = require("./transaction.model");

const transfer = async (
    senderId,
    receiverAccountNumber,
    amount,
    description,
    bank
) => {

    const session = await mongoose.startSession();

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

        return transaction;

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};

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
