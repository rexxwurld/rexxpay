const router = require("express").Router();
const controller = require("./wallet.controller");
const auth = require("../../middleware/auth");

// GET WALLET
router.get("/", auth, controller.getWallet);

// TEST CREDIT
router.post("/credit", auth, controller.credit);

module.exports = router;