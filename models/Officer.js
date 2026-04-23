const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const officerSchema = new mongoose.Schema({
  officerId:    { type: String, required: true, unique: true },
  pinHash:      { type: String, required: true },
  name:         { type: String, required: true },
  role:         { type: String, enum: ["apo", "po", "aro", "ro"], required: true },
  stationId:    { type: Number },       // apo, po
  booths:       { type: [Number] },     // apo only
  constituencyId: { type: Number },     // aro, ro
});

// hash pin before saving
officerSchema.pre("save", async function (next) {
  if (!this.isModified("pinHash")) return next();
  this.pinHash = await bcrypt.hash(this.pinHash, 10);
  next();
});

officerSchema.methods.checkPin = function (pin) {
  return bcrypt.compare(pin, this.pinHash);
};

module.exports = mongoose.model("Officer", officerSchema);
