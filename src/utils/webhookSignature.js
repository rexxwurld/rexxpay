// src/utils/webhookSignature.js
// Signs outgoing webhooks to SwiftPay so it can verify they really came
// from this bank, AND verifies incoming requests from SwiftPay (e.g.
// payout instructions). Must use the exact same algorithm (HMAC-SHA512,
// hex digest) and the exact same shared secret on both services.

const crypto = require("crypto");
const { SWIFTPAY_WEBHOOK_SECRET } = require("../config/env");

function signPayload(payload) {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHmac("sha512", SWIFTPAY_WEBHOOK_SECRET).update(body).digest("hex");
}

// Verifies a signature SwiftPay sent us (e.g. on a payout instruction).
// Same algorithm/secret as signPayload, just checked the other direction.
// Uses timingSafeEqual so response time can't leak how much of the
// signature matched.
function verifySignature(payload, signature) {
    if (!signature) return false;
    const expected = signPayload(payload);

    const expectedBuf = Buffer.from(expected, "hex");
    const givenBuf = Buffer.from(String(signature), "hex");

    if (expectedBuf.length !== givenBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, givenBuf);
}

module.exports = { signPayload, verifySignature };
