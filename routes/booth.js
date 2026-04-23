const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Booth = require("../models/Booth");
const Station = require("../models/Station");
const Candidate = require("../models/Candidate");
const FraudFlag = require("../models/FraudFlag");
const AuditLog = require("../models/AuditLog");

// GET /api/booth/station/:stationId — get all booths for a station
router.get("/station/:stationId", auth, async (req, res) => {
  try {
    const booths = await Booth.find({ stationId: Number(req.params.stationId) });
    res.json({ booths });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/booth/my — get booths assigned to this APO
router.get("/my", auth, async (req, res) => {
  try {
    if (req.user.role !== "apo") return res.status(403).json({ message: "APO only" });
    // officer doc has booths array
    const Officer = require("../models/Officer");
    const officer = await Officer.findById(req.user.id);
    const booths = await Booth.find({ boothId: { $in: officer.booths } });
    res.json({ booths });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/booth/submit — APO submits booth results
// Body: { boothId, used, candidateVotes: { "1": 200, "2": 150, ... } }
router.post("/submit", auth, async (req, res) => {
  try {
    if (req.user.role !== "apo") return res.status(403).json({ message: "APO only" });

    const { boothId, used, candidateVotes } = req.body;
    if (!boothId || used === undefined || !candidateVotes) {
      return res.status(400).json({ message: "boothId, used, and candidateVotes required" });
    }

    const booth = await Booth.findOne({ boothId });
    if (!booth) return res.status(404).json({ message: "Booth not found" });
    if (booth.submitted) return res.status(409).json({ message: "Booth already submitted" });

    // Validation
    const usedN = Number(used);
    const candTotal = Object.values(candidateVotes).reduce((a, b) => a + Number(b), 0);
    if (usedN > booth.issued) return res.status(400).json({ message: "Votes used exceeds issued ballots" });
    if (candTotal !== usedN) return res.status(400).json({ message: `Candidate votes (${candTotal}) ≠ ballots used (${usedN})` });

    // Fraud detection: turnout deviation > 20% from station average
    const stationBooths = await Booth.find({ stationId: booth.stationId, submitted: true });
    let flagged = false;
    if (stationBooths.length > 0 && booth.issued > 0) {
      const avg = stationBooths.reduce((a, b) => a + b.used / b.issued, 0) / stationBooths.length;
      const thisTurnout = usedN / booth.issued;
      if (Math.abs(thisTurnout - avg) > 0.2) {
        flagged = true;
        const station = await Station.findOne({ stationId: booth.stationId });
        await FraudFlag.create({
          booth: booth.name,
          station: station?.name || String(booth.stationId),
          issue: `Turnout deviation >20% from station average`,
          severity: "high",
        });
      }
    }

    // Update booth
    booth.used = usedN;
    booth.candidateVotes = candidateVotes;
    booth.submitted = true;
    booth.flagged = flagged;
    booth.submittedBy = req.user.name;
    booth.submittedAt = new Date();
    await booth.save();

    await AuditLog.create({ event: `${req.user.name} submitted Booth ${booth.name} results` });

    res.json({ message: "Booth submitted successfully", booth });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
