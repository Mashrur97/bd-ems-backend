const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Officer = require("../models/Officer");

// POST /api/officer/login
// Body: { officerId, pin, role }
router.post("/login", async (req, res) => {
  try {
    const { officerId, pin, role } = req.body;
    if (!officerId || !pin || !role) {
      return res.status(400).json({ message: "Officer ID, PIN and role required" });
    }

    const officer = await Officer.findOne({ officerId, role });
    if (!officer) return res.status(404).json({ message: "Officer not found" });

    const match = await officer.checkPin(pin);
    if (!match) return res.status(401).json({ message: "Incorrect PIN" });

    const token = jwt.sign(
      { id: officer._id, officerId: officer.officerId, role: officer.role, name: officer.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      officer: {
        officerId: officer.officerId,
        name: officer.name,
        role: officer.role,
        stationId: officer.stationId,
        booths: officer.booths,
        constituencyId: officer.constituencyId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
