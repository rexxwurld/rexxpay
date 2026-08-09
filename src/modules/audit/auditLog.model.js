// src/modules/audit/auditLog.model.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actorType: { type: String, enum: ["user", "system", "admin"], required: true },
        actorRef: { type: String },

        action: { type: String, required: true }, // e.g. "user.login", "transfer.blocked_limit"
        entityType: { type: String },
        entityRef: { type: String },

        ip: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed },

        severity: { type: String, enum: ["info", "warning", "critical"], default: "info" }
    },
    { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
