const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  event:     { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
