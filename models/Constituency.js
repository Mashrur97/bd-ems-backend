const mongoose = require("mongoose");

const constituencySchema = new mongoose.Schema({
  constituencyId: { type: Number, required: true, unique: true },
  name:           { type: String, required: true },
  stations:       { type: [Number] },
  compiled:       { type: Boolean, default: false },
  compiledBy:     { type: String },
  compiledAt:     { type: Date },
  candidateVotes: { type: Map, of: Number, default: {} }, // { "1": 500, "2": 350, ... }
  declared:       { type: Boolean, default: false },
  declaredBy:     { type: String },
  declaredAt:     { type: Date },
});

module.exports = mongoose.model("Constituency", constituencySchema);
