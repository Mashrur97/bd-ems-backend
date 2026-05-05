const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Report = require("../models/Report");
const Voter = require("../models/Voter");

// GET /api/reports — public, sorted by upvotes desc
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().sort({ upvotes: -1, createdAt: -1 }).select("-upvotedBy");
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/reports — voter submits a report
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "voter") return res.status(403).json({ message: "Voters only" });
    const { description, location, photo } = req.body;
    if (!description?.trim() || !location?.trim()) {
      return res.status(400).json({ message: "Description and location are required" });
    }
    const voter = await Voter.findById(req.user.id).select("name");
    if (!voter) return res.status(404).json({ message: "Voter not found" });

    const report = await Report.create({
      voterId:     req.user.id,
      voterName:   voter.name,
      description: description.trim(),
      location:    location.trim(),
      photo:       photo || null,
    });
    res.status(201).json({ message: "Report submitted", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/reports/:id/upvote — voter upvotes, one per report
router.post("/:id/upvote", auth, async (req, res) => {
  try {
    if (req.user.role !== "voter") return res.status(403).json({ message: "Voters only" });
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.upvotedBy.includes(String(req.user.id))) {
      return res.status(409).json({ message: "Already upvoted" });
    }

    report.upvotes += 1;
    report.upvotedBy.push(String(req.user.id));
    await report.save();

    res.json({ message: "Upvoted", upvotes: report.upvotes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
