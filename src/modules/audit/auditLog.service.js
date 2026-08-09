// src/modules/audit/auditLog.service.js
const AuditLog = require("./auditLog.model");

// Fire-and-forget: an audit-log write failure must never block the real
// operation. Log to stderr so it can still be caught by ops monitoring.
async function record({ actorType, actorRef, action, entityType, entityRef, ip, metadata, severity }) {
    try {
        await AuditLog.create({ actorType, actorRef, action, entityType, entityRef, ip, metadata, severity });
    } catch (err) {
        console.error("[audit] failed to write audit log:", err.message, { action });
    }
}

module.exports = { record };
