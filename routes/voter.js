const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Voter = require("../models/Voter");
const Candidate = require("../models/Candidate");
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth");

// POST /api/voter/login
// Body: { nid, dob }  — dob as "YYYY-MM-DD"
router.post("/login", async (req, res) => {
  try {
    const { nid, dob } = req.body;
    if (!nid || !dob) return res.status(400).json({ message: "NID and date of birth required" });

    const voter = await Voter.findOne({ nid });
    if (!voter) return res.status(404).json({ message: "Voter not found. Check your NID." });
    if (voter.dob !== dob) return res.status(401).json({ message: "Date of birth does not match." });

    const token = jwt.sign(
      { id: voter._id, nid: voter.nid, role: "voter" },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({
      token,
      voter: {
        nid: voter.nid,
        name: voter.name,
        district: voter.district,
        boothId: voter.boothId,
        constituencyId: voter.constituencyId,
        voted: voter.voted,
        votedAt: voter.votedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/voter/vote
// Body: { candidateId }
// Protected — requires voter JWT
router.post("/vote", auth, async (req, res) => {
  try {
    if (req.user.role !== "voter") return res.status(403).json({ message: "Only voters can cast votes" });

    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ message: "Candidate ID required" });

    const voter = await Voter.findById(req.user.id);
    if (!voter) return res.status(404).json({ message: "Voter not found" });
    if (voter.voted) return res.status(409).json({ message: "You have already voted" });

    const candidate = await Candidate.findOne({ candidateId: Number(candidateId) });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Mark voter as voted
    voter.voted = true;
    voter.votedAt = new Date();
    voter.votedCandidate = candidateId;
    await voter.save();

    // Increment candidate vote count
    await Candidate.findOneAndUpdate(
      { candidateId: Number(candidateId) },
      { $inc: { votes: 1 } }
    );

    await AuditLog.create({ event: `Voter cast vote (NID ending ${voter.nid.slice(-4)})` });

    //res.json({ message: "Vote cast successfully", voted: true });
    res.json({ message: "Vote cast successfully", voted: true, votedAt: voter.votedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/voter/me — get current voter status (voted or not)
router.get("/me", auth, async (req, res) => {
  try {
    if (req.user.role !== "voter") return res.status(403).json({ message: "Forbidden" });
    const voter = await Voter.findById(req.user.id).select("-votedCandidate -__v");
    if (!voter) return res.status(404).json({ message: "Voter not found" });
    res.json({ voter });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
