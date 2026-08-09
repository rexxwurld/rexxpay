// src/utils/webhookSignature.js
// Signs outgoing webhooks to RexxPay Infra so it can verify they really
// came from this bank and weren't forged. Must use the exact same
// algorithm (HMAC-SHA512, hex digest) and the exact same shared secret
// as RexxPay Infra's verifySignature(), or every webhook will be rejected.

const crypto = require("crypto");
const { BANK_WEBHOOK_SECRET } = require("../config/env");

function signPayload(payload) {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHmac("sha512", BANK_WEBHOOK_SECRET).update(body).digest("hex");
}

module.exports = { signPayload };
