const { processDeposit } = require("./deposit.service");

// POST /api/v1/admin/deposits
// Body: { accountNumber, amount, reference }
// Header: x-admin-key
//
// TODO: once you're integrated with a real banking rail / provider,
// replace this admin-triggered route with a public webhook route that
// the provider calls, protected by *their* signature scheme instead of
// x-admin-key. The service function (processDeposit) doesn't need to
// change - only how it gets called.
exports.simulateDeposit = async (req, res) => {
    try {
        const { accountNumber, amount, reference, rawPayload } = req.body;

        if (!accountNumber || !amount || !reference) {
            return res.status(400).json({
                status: false,
                message: "accountNumber, amount and reference are required"
            });
        }

        const result = await processDeposit({ accountNumber, amount, reference, rawPayload });

        res.status(result.duplicate ? 200 : 201).json({
            status: true,
            duplicate: result.duplicate,
            data: result.deposit
        });
    } catch (err) {
        res.status(400).json({ status: false, message: err.message });
    }
};
