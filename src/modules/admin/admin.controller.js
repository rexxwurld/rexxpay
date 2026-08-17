const { createPoolWallet, getPoolStatus, assignPoolAccount, deactivatePoolAccount, releasePoolAccount, getSettlementExport } = require("./admin.service");

// Creates a real bank wallet for SwiftPay's account pool and returns
// its real account number. Called by you (manually, or from SwiftPay's
// provisioning code) with the x-admin-key header - never by end users.
exports.createPoolAccount = async (req, res) => {
    try {
        const { label } = req.body;
        const account = await createPoolWallet(label);

        res.status(201).json({
            status: true,
            data: account
        });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};

// GET /api/v1/admin/pool-status
// Quick sanity check: pool balance vs sum of linked wallet balances.
exports.getPoolStatus = async (req, res) => {
    try {
        const status = await getPoolStatus();
        res.json({ status: true, data: status });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};

// PATCH /api/v1/admin/pool-accounts/:accountNumber/assign
// Called by SwiftPay right after it hands this account out to a customer.
exports.assignPoolAccount = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await assignPoolAccount(accountNumber);
        res.json({ status: true, data: result });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};

// PATCH /api/v1/admin/pool-accounts/:accountNumber/deactivate
// Called by SwiftPay when a checkout on this account finishes and it
// enters cooldown - not back in the pool yet, so deposits still reject.
exports.deactivatePoolAccount = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await deactivatePoolAccount(accountNumber);
        res.json({ status: true, data: result });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};

// PATCH /api/v1/admin/pool-accounts/:accountNumber/release
// Called by SwiftPay once the account is back in its own available pool.
exports.releasePoolAccount = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await releasePoolAccount(accountNumber);
        res.json({ status: true, data: result });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};

// GET /api/v1/admin/settlement-export?from=2026-08-16&to=2026-08-17
// Called by SwiftPay's reconcile.js (via a small fetch wrapper) to pull
// the day's confirmed deposits and compare against its own Transaction
// records. from/to are optional ISO date strings; omitting both returns
// every confirmed deposit ever recorded for SwiftPay's pool.
exports.getSettlementExport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const rows = await getSettlementExport({ from, to });
        res.json({ status: true, count: rows.length, data: rows });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};
