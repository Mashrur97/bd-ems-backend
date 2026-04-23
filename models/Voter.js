const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  nid:          { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  dob:          { type: String, required: true }, // "YYYY-MM-DD"
  district:     { type: String },
  boothId:      { type: Number, required: true },
  constituencyId: { type: Number, required: true },
  voted:        { type: Boolean, default: false },
  votedAt:      { type: Date },
  votedCandidate: { type: Number }, // candidate id, stored for audit, hidden from public
});

module.exports = mongoose.model("Voter", voterSchema);
