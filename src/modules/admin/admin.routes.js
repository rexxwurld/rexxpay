const router = require("express").Router();
const controller = require("./admin.controller");
const requireAdminKey = require("../../middleware/adminKey");

// POST /api/v1/admin/pool-accounts
// Body: { "label": "optional description" }
// Header: x-admin-key: <ADMIN_KEY>
router.post("/pool-accounts", requireAdminKey, controller.createPoolAccount);

// GET /api/v1/admin/pool-status
// Header: x-admin-key
router.get("/pool-status", requireAdminKey, controller.getPoolStatus);

// PATCH /api/v1/admin/pool-accounts/:accountNumber/assign
// Called by SwiftPay right after handing this account to a customer.
// Header: x-admin-key
router.patch("/pool-accounts/:accountNumber/assign", requireAdminKey, controller.assignPoolAccount);

// PATCH /api/v1/admin/pool-accounts/:accountNumber/deactivate
// Called by SwiftPay when a checkout on this account finishes and it
// enters cooldown - not back in the pool yet, so deposits still reject.
// Header: x-admin-key
router.patch("/pool-accounts/:accountNumber/deactivate", requireAdminKey, controller.deactivatePoolAccount);

// PATCH /api/v1/admin/pool-accounts/:accountNumber/release
// Called by SwiftPay once the account is back in its own available pool
// (payment completed + cooldown expired, or an abandoned/stale checkout).
// Header: x-admin-key
router.patch("/pool-accounts/:accountNumber/release", requireAdminKey, controller.releasePoolAccount);

module.exports = router;
