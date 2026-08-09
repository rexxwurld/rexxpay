const router = require("express").Router();
const controller = require("./admin.controller");
const requireAdminKey = require("../../middleware/adminKey");

// POST /api/v1/admin/pool-accounts
// Body: { "label": "optional description" }
// Header: x-admin-key: <ADMIN_KEY>
router.post("/pool-accounts", requireAdminKey, controller.createPoolAccount);

module.exports = router;
