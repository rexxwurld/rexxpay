const { createPoolWallet } = require("./admin.service");

// Creates a real bank wallet for RexxPay Infra's account pool and returns
// its real account number. Called by you (manually, or from Infra's
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
