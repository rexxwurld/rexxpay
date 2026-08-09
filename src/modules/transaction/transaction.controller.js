const service = require("./transaction.service");
const { getUserTransactions } = require("./transaction.service");

// GET HISTORY
const getHistory = async (req, res) => {
    try {

        const userId = req.user.id;

        const transactions = await getUserTransactions(userId);

        res.json({
            success: true,
            transactions
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// TRANSFER MONEY
const transfer = async (req, res) => {
    try {
        const { accountNumber, amount, description, bank, idempotencyKey } = req.body;

        // Accept the idempotency key from a header too, matching how most
        // real payment APIs do it (e.g. "Idempotency-Key").
        const key = idempotencyKey || req.headers["idempotency-key"] || null;

        const result = await service.transfer(
            req.user.id,
            accountNumber,
            amount,
            description,
            bank,
            key
        );

        res.status(result.duplicate ? 200 : 201).json({
            message: result.duplicate ? "Transfer already processed (idempotent replay)" : "Transfer successful",
            duplicate: result.duplicate,
            transaction: result.transactions
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getHistory,
    transfer
};