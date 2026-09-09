const express = require("express");
const router = express.Router();

const refundController = require("./refund.controller");

// Create a refund
// POST /api/v1/refunds
router.post("/", refundController.createRefund);

// Get a refund by reference
// GET /api/v1/refunds/:reference
router.get("/:reference", refundController.getRefund);

// Move refund to processing
// POST /api/v1/refunds/:reference/process
router.post("/:reference/process", refundController.processRefund);

// Mark refund successful
// POST /api/v1/refunds/:reference/success
router.post(
  "/:reference/success",
  refundController.markRefundSuccessful
);

// Mark refund failed
// POST /api/v1/refunds/:reference/fail
router.post(
  "/:reference/fail",
  refundController.markRefundFailed
);

// Mark refund reversed
// POST /api/v1/refunds/:reference/reverse
router.post(
  "/:reference/reverse",
  refundController.markRefundReversed
);

module.exports = router;
