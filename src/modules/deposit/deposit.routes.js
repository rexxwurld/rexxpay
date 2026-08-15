const router = require("express").Router();
const controller = require("./deposit.controller");
const requireAdminKey = require("../../middleware/adminKey");

// POST /api/v1/admin/deposits
router.post("/", requireAdminKey, controller.simulateDeposit);

module.exports = router;
