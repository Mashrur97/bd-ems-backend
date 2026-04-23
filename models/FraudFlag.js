const mongoose = require("mongoose");

const fraudFlagSchema = new mongoose.Schema({
  booth:     { type: String },
  station:   { type: String },
  issue:     { type: String },
  severity:  { type: String, enum: ["low", "medium", "high"] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FraudFlag", fraudFlagSchema);
