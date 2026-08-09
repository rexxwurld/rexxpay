const crypto = require("crypto");
const User = require("../auth/user.model");
const Wallet = require("../wallet/wallet.model");
const generateAccountNumber = require("../../utils/generateAccountNumber");
const { hashPassword } = require("../../utils/hash");

// Creates a real wallet (with a real, unique account number) owned by a
// throwaway "system" user, flagged so incoming transfers to it are
// recognized as belonging to RexxPay Infra's pool rather than a normal
// end-user account. Nobody logs into this user - it exists only to
// satisfy Wallet's required userId reference.
async function createPoolWallet(label) {
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const email = `pool_${randomSuffix}@rexxpay.infra.internal`;
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashed = await hashPassword(randomPassword);

    const user = await User.create({
        fullname: label || "RexxPay Infra Pool Account",
        email,
        phone: "",
        password: hashed
    });

    const accountNumber = await generateAccountNumber();

    const wallet = await Wallet.create({
        userId: user._id,
        accountNumber,
        balance: 0,
        linkedService: "rexxpay_infra"
    });

    return {
        accountNumber: wallet.accountNumber,
        walletId: wallet._id,
        userId: user._id
    };
}

module.exports = { createPoolWallet };
