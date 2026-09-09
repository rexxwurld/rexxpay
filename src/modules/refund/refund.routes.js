const router = require("express").Router();
const controller = require("./refund.controller");
const verifySwiftpaySignature = require("../../middleware/verifySwiftpaySignature");

router.post("/", verifySwiftpaySignature, controller.createRefund);
router.get("/:reference", controller.getRefund);

module.exports = router;
