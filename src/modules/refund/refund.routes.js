const router = require("express").Router();

const controller = require("./refund.controller");
const verifySwiftpaySignature = require("../../middleware/verifySwiftpaySignature");

// POST /api/v1/refunds
// Called by SwiftPay only
router.post("/", verifySwiftpaySignature, controller.createRefund);

// GET /api/v1/refunds/:reference
router.get("/:reference", controller.getRefund);

module.exports = router;
