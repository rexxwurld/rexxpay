// src/middleware/adminKey.js
// Guards routes that should only be callable by you (or a trusted service
// like RexxPay Infra) - never by an arbitrary end user, even a logged-in one.

module.exports = function requireAdminKey(req, res, next) {
    const key = req.headers["x-admin-key"];

    if (!process.env.ADMIN_KEY) {
        // Fail closed: if no admin key is configured, nobody gets in.
        return res.status(500).json({ message: "admin_key_not_configured" });
    }

    if (!key || key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "unauthorized" });
    }

    next();
};
