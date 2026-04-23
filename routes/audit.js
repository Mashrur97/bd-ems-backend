const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

// GET /api/audit — RO only
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "ro") return res.status(403).json({ message: "RO only" });
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
