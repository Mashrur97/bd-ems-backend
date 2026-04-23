const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  stationId:     { type: Number, required: true, unique: true },
  name:          { type: String, required: true },
  constituencyId:{ type: Number, required: true },
  booths:        { type: [Number] },
  verified:      { type: Boolean, default: false },
  submitted:     { type: Boolean, default: false },
  verifiedBy:    { type: String },
  verifiedAt:    { type: Date },
});

module.exports = mongoose.model("Station", stationSchema);
