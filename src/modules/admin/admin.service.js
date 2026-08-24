const Wallet = require("../wallet/wallet.model");
const generateAccountNumber = require("../../utils/generateAccountNumber");
const { getPoolByService, createPool } = require("../settlement/settlementPool.service");

// Creates a real virtual account (a Wallet row with a real, unique account
// number), linked to SwiftPay's SettlementPool so incoming deposits are
// recognized as belonging to the pool rather than a normal end-user
// account. No User is created or needed - userId stays null since this
// account isn't owned by any real person.
//
// Idempotent on the pool itself: if a SwiftPay pool already exists, this
// wallet links to it instead of creating a second, disconnected pool.
async function createPoolWallet(label) {
    let pool = await getPoolByService("swiftpay");
    if (!pool) {
        pool = await createPool({ label: label || "SwiftPay Settlement Pool", linkedService: "swiftpay" });
    }

    const accountNumber = await generateAccountNumber();

    const wallet = await Wallet.create({
        accountNumber,
        balance: 0,
        linkedService: "swiftpay",
        pool: pool._id
    });

    return {
        accountNumber: wallet.accountNumber,
        walletId: wallet._id,
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

// Called by SwiftPay right after it hands a pool account out to a
// customer for a checkout. Flips our side's status flag to match, so
// deposit.service.js's assigned-only check actually reflects reality
// instead of every pool wallet sitting at "available" forever.
async function assignPoolAccount(accountNumber, expectedAmount) {
    const wallet = await Wallet.findOne({ accountNumber, linkedService: "swiftpay" });
    if (!wallet) throw new Error("pool_account_not_found");

    wallet.status = "assigned";
    wallet.expectedAmount = expectedAmount ?? null;
    await wallet.save();

    return { accountNumber: wallet.accountNumber, status: wallet.status, expectedAmount: wallet.expectedAmount };
}

// Called by SwiftPay right after a checkout on this account completes
// (or when it starts a cooldown for any other reason). The account isn't
// back in SwiftPay's available pool yet, so it should still reject
// deposits the same as "assigned" - this just makes that state visible
// and honest in the bank's own records instead of leaving it saying
// "assigned" for a checkout that's actually already over.
async function deactivatePoolAccount(accountNumber) {
    const wallet = await Wallet.findOne({ accountNumber, linkedService: "swiftpay" });
    if (!wallet) throw new Error("pool_account_not_found");

    wallet.status = "deactivated";
    await wallet.save();

    return { accountNumber: wallet.accountNumber, status: wallet.status };
}

// Called by SwiftPay once a virtual account's payment is done (or the
// checkout it was holding is abandoned/stale) and it's handing the
// account back to its own available pool. This just flips our side's
// status flag to match, for audit/dashboard purposes - it does NOT
// touch balance or the pool; the wallet's accumulated balance stays put
// and keeps counting toward the settlement pool regardless of status.
async function releasePoolAccount(accountNumber) {
    const wallet = await Wallet.findOne({ accountNumber, linkedService: "swiftpay" });
    if (!wallet) throw new Error("pool_account_not_found");

    wallet.status = "available";
    await wallet.save();

    return { accountNumber: wallet.accountNumber, status: wallet.status };
}

// Called by SwiftPay's reconcile job to compare its own Transaction
// records against what actually settled here. Returns one row per
// confirmed deposit on a SwiftPay-linked pool wallet within the given
// date range, shaped to match the bankReference SwiftPay already stores
// (see deposit.service.js's notifySwiftPay: bankReference is always
// `rxpbank_<deposit._id>`) so the two sides can be matched 1:1 without
// SwiftPay needing to know anything about our internal Deposit schema.
async function getSettlementExport({ from, to } = {}) {
    const Deposit = require("../deposit/deposit.model");

    const match = { status: "confirmed" };
    if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
    }

    const deposits = await Deposit.find(match)
        .populate("wallet", "accountNumber linkedService")
        .sort({ createdAt: 1 });

    return deposits
        .filter((d) => d.wallet && d.wallet.linkedService === "swiftpay")
        .map((d) => ({
            bankReference: `rxpbank_${d._id.toString()}`,
            depositReference: d.reference,
            accountNumber: d.wallet.accountNumber,
            amount: d.amount,
            currency: d.currency,
            settledAt: d.createdAt
        }));
}

module.exports = { createPoolWallet, getPoolStatus, assignPoolAccount, deactivatePoolAccount, releasePoolAccount, getSettlementExport };
