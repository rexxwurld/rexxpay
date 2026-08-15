const crypto = require("crypto");
const User = require("../auth/user.model");
const Wallet = require("../wallet/wallet.model");
const generateAccountNumber = require("../../utils/generateAccountNumber");
const { hashPassword } = require("../../utils/hash");
const { getPoolByService, createPool } = require("../settlement/settlementPool.service");

// Creates a real wallet (with a real, unique account number) owned by a
// throwaway "system" user, linked to SwiftPay's SettlementPool so incoming
// transfers/deposits to it are recognized as belonging to the pool rather
// than a normal end-user account. Nobody logs into this user - it exists
// only to satisfy Wallet's required userId reference.
//
// Idempotent on the pool itself: if a SwiftPay pool already exists, this
// wallet links to it instead of creating a second, disconnected pool.
async function createPoolWallet(label) {
    let pool = await getPoolByService("swiftpay");
    if (!pool) {
        pool = await createPool({ label: label || "SwiftPay Settlement Pool", linkedService: "swiftpay" });
    }

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const email = `pool_${randomSuffix}@rexxpay.swiftpay.internal`;
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashed = await hashPassword(randomPassword);

    const user = await User.create({
        fullname: label || "SwiftPay Pool Account",
        email,
        phone: "",
        password: hashed
    });

    const accountNumber = await generateAccountNumber();

    const wallet = await Wallet.create({
        userId: user._id,
        accountNumber,
        balance: 0,
        linkedService: "swiftpay",
        pool: pool._id
    });

    return {
        accountNumber: wallet.accountNumber,
        walletId: wallet._id,
        userId: user._id,
        poolId: pool._id
    };
}

async function getPoolStatus() {
    const pool = await getPoolByService("swiftpay");
    if (!pool) throw new Error("no_swiftpay_pool_exists_yet");

    const wallets = await Wallet.find({ pool: pool._id });
    const walletBalanceSum = wallets.reduce((sum, w) => sum + w.balance, 0);

    return {
        pool,
        walletCount: wallets.length,
        walletBalanceSum,
        inSync: walletBalanceSum <= pool.poolBalance
    };
}

module.exports = { createPoolWallet, getPoolStatus };
