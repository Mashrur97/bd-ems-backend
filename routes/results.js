const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Candidate = require("../models/Candidate");
const ElectionState = require("../models/ElectionState");
const FraudFlag = require("../models/FraudFlag");
const AuditLog = require("../models/AuditLog");
const Voter = require("../models/Voter");

// GET /api/results/public — guest page + voter results tab
// No auth required
router.get("/public", async (req, res) => {
  try {
    const candidates = await Candidate.find().select("-__v").sort({ votes: -1 });
    const state = await ElectionState.findOne();
    const fraudFlags = await FraudFlag.find().sort({ createdAt: -1 }).limit(10);
    const totalVoters = await Voter.countDocuments({ voted: true });

    const totalVotes = candidates.reduce((a, c) => a + c.votes, 0);
    const eligibleVoters = state?.eligibleVoters || 8200;
    const turnout = ((totalVoters / eligibleVoters) * 100).toFixed(1);

    // Build votes map { candidateId: count }
    const votesMap = {};
    candidates.forEach(c => { votesMap[c.candidateId] = c.votes; });

    res.json({
      candidates,
      votesMap,
      totalVotes,
      turnout,
      eligibleVoters,
      resultsDeclared: state?.resultsDeclared || false,
      constituencyCompiled: state?.constituencyCompiled || false,
      fraudFlags,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/results/declare — RO declares
router.post("/declare", auth, async (req, res) => {
  try {
    if (req.user.role !== "ro") return res.status(403).json({ message: "RO only" });

    const Officer = require("../models/Officer");
    const Constituency = require("../models/Constituency");
    
    const officer = await Officer.findById(req.user.id);
    const state = await ElectionState.findOne();
    if (!state?.constituencyCompiled) {
      return res.status(400).json({ message: "Constituency must be compiled by ARO first" });
    }

    const constituency = await Constituency.findOne({ constituencyId: officer.constituencyId });
    if (!constituency?.compiled) {
      return res.status(403).json({ message: "Constituency must be compiled before declaration" });
    }
    if (constituency.declared) {
      return res.status(409).json({ message: "Results already declared" });
    }

    // Mark constituency as declared
    constituency.declared = true;
    constituency.declaredBy = req.user.name;
    constituency.declaredAt = new Date();
    await constituency.save();

    await ElectionState.updateOne({}, {
      $set: {
        resultsDeclared: true,
        declaredBy: req.user.name,
        declaredAt: new Date(),
      },
    });

    await AuditLog.create({ event: `RO ${req.user.name} officially declared results for ${constituency.name}` });

    res.json({ message: "Results declared successfully", constituency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
