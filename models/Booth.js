const mongoose = require("mongoose");

const boothSchema = new mongoose.Schema({
  boothId:        { type: Number, required: true, unique: true },
  name:           { type: String, required: true },
  stationId:      { type: Number, required: true },
  issued:         { type: Number, required: true },
  used:           { type: Number, default: 0 },
  candidateVotes: { type: Map, of: Number, default: {} }, // { "1": 200, "2": 150 }
  submitted:      { type: Boolean, default: false },
  flagged:        { type: Boolean, default: false },
  submittedBy:    { type: String },
  submittedAt:    { type: Date },
});

module.exports = mongoose.model("Booth", boothSchema);
