const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  center:      { type: String },
  stationId:   { type: Number },
  type:        { type: String },
  desc:        { type: String },
  status:      { type: String, enum: ["active", "resolved"], default: "active" },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model("Incident", incidentSchema);
