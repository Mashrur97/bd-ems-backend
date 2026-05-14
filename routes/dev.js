const router = require("express").Router();
const { execSync } = require("child_process");

router.post("/seed", (req, res) => {
  try {
    execSync("node scripts/seed.js", { cwd: process.cwd() });
    res.json({ message: "Seeded!" });
  } catch (err) {
    res.status(500).json({ message: "Seed failed", error: err.message });
  }
});

module.exports = router;
