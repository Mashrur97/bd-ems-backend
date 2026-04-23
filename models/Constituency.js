const mongoose = require("mongoose");

const constituencySchema = new mongoose.Schema({
  constituencyId: { type: Number, required: true, unique: true },
  name:           { type: String, required: true },
  stations:       { type: [Number] },
  compiled:       { type: Boolean, default: false },
  compiledBy:     { type: String },
  compiledAt:     { type: Date },
});

module.exports = mongoose.model("Constituency", constituencySchema);
