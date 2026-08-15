const router = require("express").Router();
const controller = require("./payout.controller");
const verifySwiftpaySignature = require("../../middleware/verifySwiftpaySignature");

// POST /api/v1/payouts - called by SwiftPay only
router.post("/", verifySwiftpaySignature, controller.createPayout);

module.exports = router;
