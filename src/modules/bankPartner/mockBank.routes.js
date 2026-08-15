// src/modules/bankPartner/mockBank.routes.js
//
// DEVELOPMENT ONLY. Delete/disable before production, or guard it with
// the NODE_ENV check below (see app.js).
//
// Simulates a customer's bank transfer landing in a RexxPay virtual
// account, without a real NIBSS/banking-rail connection. See
// mockBank.controller.js for what actually happens.

const router = require("express").Router();
const controller = require("./mockBank.controller");

// POST /api/v1/mock-bank/simulate-transfer
// Body: { accountNumber, amount, currency? }
router.post("/simulate-transfer", controller.simulateTransfer);

module.exports = router;
