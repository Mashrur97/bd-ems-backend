require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "https://bd-ems-live.netlify.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/voter",         require("./routes/voter"));
app.use("/api/officer",       require("./routes/officer"));
app.use("/api/booth",         require("./routes/booth"));
app.use("/api/station",       require("./routes/station"));
app.use("/api/constituency",  require("./routes/constituency"));
app.use("/api/results",       require("./routes/results"));
app.use("/api/audit",         require("./routes/audit"));
app.use("/api/incidents",     require("./routes/incidents"));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "EMS API running" }));

// ── Connect DB + Start ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
