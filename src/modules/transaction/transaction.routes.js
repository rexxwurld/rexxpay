const router = require("express").Router();
const controller = require("./transaction.controller");
const auth = require("../../middleware/auth");

// TRANSFER
router.get("/", auth, controller.getHistory);
router.post("/transfer", auth, controller.transfer);


module.exports = router;