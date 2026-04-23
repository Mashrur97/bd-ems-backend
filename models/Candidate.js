const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  candidateId: { type: Number, required: true, unique: true },
  name:        { type: String, required: true },
  party:       { type: String, required: true },
  symbol:      { type: String },
  color:       { type: String },
  votes:       { type: Number, default: 0 },
});

module.exports = mongoose.model("Candidate", candidateSchema);
