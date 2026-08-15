const { createPoolWallet, getPoolStatus } = require("./admin.service");

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
