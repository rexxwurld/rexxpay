const Wallet = require("./wallet.model");
const generateAccountNumber = require("../../utils/generateAccountNumber");

// CREATE WALLET (AUTO ON REGISTER)
const createWallet = async (userId) => {

    const accountNumber = await generateAccountNumber();

    const wallet = await Wallet.create({
        userId,
        accountNumber,
        balance: 0
    });

    return wallet;
};

// GET WALLET
const getWallet = async (userId) => {
    return await Wallet.findOne({ userId });
};

// CREDIT WALLET
const creditWallet = async (userId, amount) => {

    const wallet = await Wallet.findOne({ userId });

    wallet.balance += Number(amount);

    await wallet.save();

    return wallet;
};

// DEBIT WALLET
const debitWallet = async (userId, amount) => {

    const wallet = await Wallet.findOne({ userId });

    if (wallet.balance < amount) {
        throw new Error("Insufficient balance");
    }

    wallet.balance -= Number(amount);

    await wallet.save();

    return wallet;
};

module.exports = {
    createWallet,
    getWallet,
    creditWallet,
    debitWallet
};