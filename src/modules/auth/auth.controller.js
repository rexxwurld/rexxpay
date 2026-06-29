const service = require("./auth.service");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const user = await service.register(req.body);
        res.status(201).json({ message: "Registered", user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user } = await service.login(email, password);

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // ← change to true in production
            sameSite: "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.json({ message: "Logged in", user });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
};