const walletService = require("./wallet.service");

// GET WALLET
exports.getWallet = async (req, res) => {
    try {

        const wallet = await walletService.getWallet(req.user.id);

        res.json(wallet);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// CREDIT (TEST ONLY)
exports.credit = async (req, res) => {
    try {

        const { amount } = req.body;

        const wallet = await walletService.creditWallet(req.user.id, amount);

        res.json(wallet);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};