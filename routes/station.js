const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Station = require("../models/Station");
const AuditLog = require("../models/AuditLog");

// GET /api/station/my — PO gets their station
router.get("/my", auth, async (req, res) => {
  try {
    if (req.user.role !== "po") return res.status(403).json({ message: "PO only" });
    const Officer = require("../models/Officer");
    const officer = await Officer.findById(req.user.id);
    const station = await Station.findOne({ stationId: officer.stationId });
    if (!station) return res.status(404).json({ message: "Station not found" });
    res.json({ station });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/station/constituency/:constituencyId — ARO/RO gets all stations
router.get("/constituency/:constituencyId", auth, async (req, res) => {
  try {
    const stations = await Station.find({ constituencyId: Number(req.params.constituencyId) });
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/station/verify — PO verifies their station
router.post("/verify", auth, async (req, res) => {
  try {
    if (req.user.role !== "po") return res.status(403).json({ message: "PO only" });
    const Officer = require("../models/Officer");
    const Booth = require("../models/Booth");
    
    const officer = await Officer.findById(req.user.id);
    const station = await Station.findOne({ stationId: officer.stationId });
    if (!station) return res.status(404).json({ message: "Station not found" });
    if (station.verified) return res.status(409).json({ message: "Station already verified" });

    // Check station has booths
    const booths = await Booth.find({ stationId: station.stationId });
    if (booths.length === 0) {
      return res.status(400).json({ message: "Station has no booths. Cannot verify." });
    }

    // All booths must be submitted before the station can be verified
    const submittedBooths = booths.filter(b => b.submitted).length;
    const totalBooths = booths.length;

    if (submittedBooths !== totalBooths) {
      return res.status(400).json({ 
        message: `Cannot verify: ${submittedBooths}/${totalBooths} booths submitted. All booths must be submitted first.` 
      });
    }

    station.verified = true;
    station.submitted = true;
    station.verifiedBy = req.user.name;
    station.verifiedAt = new Date();
    await station.save();

    await AuditLog.create({ 
      event: `PO ${req.user.name} verified station: ${station.name} (${totalBooths}/${totalBooths} booths submitted)` 
    });

    res.json({ message: "Station verified", station });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
