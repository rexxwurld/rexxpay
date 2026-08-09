// src/modules/ledger/ledger.service.js
const LedgerEntry = require("./ledger.model");

/**
 * Posts a balanced debit+credit pair for one transfer leg. Must be called
 * inside the same mongoose session as the Wallet.balance update, so the
 * cached balance and the ledger can never drift apart.
 */
async function postTransferEntries({ entryGroup, amount, senderWalletId, receiverWalletId, sourceRef, session }) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("ledger_invalid_amount");
    }
    if (!session) {
        throw new Error("ledger_requires_session");
    }

    return LedgerEntry.create(
        [
            {
                entryGroup,
                wallet: senderWalletId,
                direction: "debit",
                amount,
                sourceType: "transfer",
                sourceRef,
                description: "Transfer sent"
            },
            {
                entryGroup,
                wallet: receiverWalletId,
                direction: "credit",
                amount,
                sourceType: "transfer",
                sourceRef,
                description: "Transfer received"
            }
        ],
        { session, ordered: true }
    );
}

async function computeBalance(walletId) {
    const [result] = await LedgerEntry.aggregate([
        { $match: { wallet: walletId } },
        {
            $group: {
                _id: null,
                credits: { $sum: { $cond: [{ $eq: ["$direction", "credit"] }, "$amount", 0] } },
                debits: { $sum: { $cond: [{ $eq: ["$direction", "debit"] }, "$amount", 0] } }
            }
        }
    ]);
    if (!result) return 0;
    return result.credits - result.debits;
}

module.exports = { postTransferEntries, computeBalance };
