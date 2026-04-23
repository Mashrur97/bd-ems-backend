const mongoose = require("mongoose");

// Single document — always find with findOne()
// Tracks global election state
const electionStateSchema = new mongoose.Schema({
  constituencyCompiled: { type: Boolean, default: false },
  resultsDeclared:      { type: Boolean, default: false },
  declaredBy:           { type: String },
  declaredAt:           { type: Date },
  eligibleVoters:       { type: Number, default: 8200 },
});

module.exports = mongoose.model("ElectionState", electionStateSchema);
