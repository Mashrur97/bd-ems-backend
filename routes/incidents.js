const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Incident = require("../models/Incident");
const AuditLog = require("../models/AuditLog");

// GET /api/incidents — PO/ARO/RO
router.get("/", auth, async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/incidents — PO reports incident
// Body: { type, desc, center }
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "po") return res.status(403).json({ message: "PO only" });
    const { type, desc, center } = req.body;
    if (!type || !desc || !center) return res.status(400).json({ message: "type, desc, center required" });

    const incident = await Incident.create({ type, desc, center });
    await AuditLog.create({ event: `Incident reported: ${type} at ${center}` });

    res.json({ message: "Incident reported", incident });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
