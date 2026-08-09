const service = require("./auth.service");
const jwt = require("jsonwebtoken");
const auditLog = require("../audit/auditLog.service");

exports.register = async (req, res) => {
    try {
        const user = await service.register(req.body);
        await auditLog.record({
            actorType: "user",
            actorRef: user._id.toString(),
            action: "user.registered",
            ip: req.ip
        });
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

        await auditLog.record({
            actorType: "user",
            actorRef: user._id.toString(),
            action: "user.login",
            ip: req.ip
        });

        res.json({ message: "Logged in", user });

    } catch (err) {
        // Failed logins matter for security monitoring too - brute force /
        // credential stuffing shows up as a burst of these.
        await auditLog.record({
            actorType: "user",
            action: "user.login_failed",
            ip: req.ip,
            severity: "warning",
            metadata: { email: req.body?.email }
        });
        res.status(400).json({ message: err.message });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
};
