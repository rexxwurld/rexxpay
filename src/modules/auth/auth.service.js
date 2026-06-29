
const User = require("./user.model");
const { hashPassword, comparePassword } = require("../../utils/hash");
const generateToken = require("../../utils/token");

const { createWallet } = require("../wallet/wallet.service");

const register = async (data) => {

    const exists = await User.findOne({ email: data.email });
    if (exists) throw new Error("User already exists");

    const hashed = await hashPassword(data.password);

    const user = await User.create({
        fullname: data.fullname,
        email: data.email,
        phone: data.phone,
        password: hashed
    });

    await createWallet(user._id);

    return user;
};

const login = async (email, password) => {

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const match = await comparePassword(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    const token = generateToken(user);

    return { user, token };
};

module.exports = { register, login };