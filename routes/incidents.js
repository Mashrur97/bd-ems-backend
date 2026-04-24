const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Incident = require("../models/Incident");
const AuditLog = require("../models/AuditLog");

// GET /api/incidents — PO sees own, ARO/RO sees all
router.get("/", auth, async (req, res) => {
  try {
    const Officer = require("../models/Officer");
    const officer = await Officer.findById(req.user.id);
    
    let query = {};
    if (req.user.role === "po") {
      query.stationId = officer.stationId;
    }

    const incidents = await Incident.find(query).sort({ createdAt: -1 });
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

    const Officer = require("../models/Officer");
    const officer = await Officer.findById(req.user.id);

    const incident = await Incident.create({ 
      type, 
      desc, 
      center, 
      stationId: officer.stationId 
    });
    await AuditLog.create({ event: `Incident reported: ${type} at ${center}` });

    res.json({ message: "Incident reported", incident });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/incidents/:id — PO resolves their own incident
router.patch("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "po") return res.status(403).json({ message: "PO only" });

    const Officer = require("../models/Officer");
    const officer = await Officer.findById(req.user.id);

    const incident = await Incident.findOne({ 
      _id: req.params.id,
      stationId: officer.stationId 
    });
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    incident.status = "resolved";
    await incident.save();
    await AuditLog.create({ event: `Incident resolved: ${incident.type} at ${incident.center} by PO ${req.user.name}` });

    res.json({ message: "Incident resolved", incident });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
