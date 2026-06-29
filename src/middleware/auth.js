const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.cookies.token; // ← from cookie now

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};