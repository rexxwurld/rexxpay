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
        const { accountNumber, amount, description, bank } = req.body;

        const result = await service.transfer(
            req.user.id,
            accountNumber,
            amount,
            description,
            bank
        );

        res.json({
            message: "Transfer successful",
            transaction: result
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getHistory,
    transfer
};