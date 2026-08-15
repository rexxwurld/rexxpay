// src/middleware/verifySwiftpaySignature.js
//
// Guards routes that SwiftPay calls into us on (currently: payout
// instructions). Confirms the request really came from SwiftPay and
// wasn't forged, using the same shared secret + HMAC-SHA512 scheme
// already used for our outbound deposit-notification webhook.
//
// Expects header: x-swiftpay-signature
// Signed over: JSON.stringify(req.body)

const { verifySignature } = require("../utils/webhookSignature");

module.exports = function verifySwiftpaySignature(req, res, next) {
    const signature = req.headers["x-swiftpay-signature"];

    if (!verifySignature(req.body, signature)) {
        return res.status(401).json({ status: false, message: "invalid_signature" });
    }

    next();
};
