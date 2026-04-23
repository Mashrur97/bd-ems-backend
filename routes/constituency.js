const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Constituency = require("../models/Constituency");
const ElectionState = require("../models/ElectionState");
const AuditLog = require("../models/AuditLog");

// GET /api/constituency/all
router.get("/all", auth, async (req, res) => {
  try {
    const constituencies = await Constituency.find();
    res.json({ constituencies });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/constituency/compile — ARO compiles
router.post("/compile", auth, async (req, res) => {
  try {
    if (req.user.role !== "aro") return res.status(403).json({ message: "ARO only" });

    const Officer = require("../models/Officer");
    const officer = await Officer.findById(req.user.id);

    const constituency = await Constituency.findOne({ constituencyId: officer.constituencyId });
    if (!constituency) return res.status(404).json({ message: "Constituency not found" });

    constituency.compiled = true;
    constituency.compiledBy = req.user.name;
    constituency.compiledAt = new Date();
    await constituency.save();

    await ElectionState.updateOne({}, { $set: { constituencyCompiled: true } });
    await AuditLog.create({ event: `ARO ${req.user.name} compiled constituency and forwarded to RO` });

    res.json({ message: "Constituency compiled", constituency });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
