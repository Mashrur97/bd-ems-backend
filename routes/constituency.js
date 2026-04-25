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
    const Booth = require("../models/Booth");
    const officer = await Officer.findById(req.user.id);

    const constituency = await Constituency.findOne({ constituencyId: officer.constituencyId });
    if (!constituency) return res.status(404).json({ message: "Constituency not found" });

    const Station = require("../models/Station");
    const verifiedStations = await Station.find({ 
      constituencyId: officer.constituencyId, 
      verified: true 
    });

    if (verifiedStations.length === 0) {
      return res.status(400).json({ message: "No stations verified. At least one station must be verified before compiling." });
    }

    if (constituency.compiled) return res.status(409).json({ message: "Constituency already compiled" });

    // Get all submitted booths from verified stations
    const verifiedStationIds = verifiedStations.map(s => s.stationId);
    const submittedBooths = await Booth.find({ 
      stationId: { $in: verifiedStationIds }, 
      submitted: true 
    });

    // Aggregate candidate votes across all submitted booths
    const aggregatedVotes = {};
    submittedBooths.forEach(booth => {
      const cv = booth.candidateVotes;
      if (cv) {
        const votes = cv instanceof Map ? Object.fromEntries(cv) : cv;
        Object.entries(votes).forEach(([candId, count]) => {
          const candidateId = Number(candId);
          aggregatedVotes[candidateId] = (aggregatedVotes[candidateId] || 0) + Number(count);
        });
      }
    });

    constituency.compiled = true;
    constituency.compiledBy = req.user.name;
    constituency.compiledAt = new Date();
    constituency.candidateVotes = aggregatedVotes;
    await constituency.save();

    await ElectionState.updateOne({}, { $set: { constituencyCompiled: true } });
    await AuditLog.create({ event: `ARO ${req.user.name} compiled constituency: ${constituency.name} with ${submittedBooths.length} submitted booths` });

    res.json({ message: "Constituency compiled", constituency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
