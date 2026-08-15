const { createPoolWallet, getPoolStatus, assignPoolAccount, releasePoolAccount } = require("./admin.service");

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
