const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  voterId:    { type: String, required: true },
  voterName:  { type: String, required: true },
  description:{ type: String, required: true },
  location:   { type: String, required: true },
  photo:      { type: String }, // base64
  upvotes:    { type: Number, default: 0 },
  upvotedBy:  { type: [String], default: [] }, // array of voterIds
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
