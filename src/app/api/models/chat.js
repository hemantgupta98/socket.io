import mongoose from "mongoose";

const userMessage = new mongoose.Schema({
  room: { type: String, require: true },
  from: { type: String, require: true },
  to: { type: String },
  text: { type: String },
  createdAT: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("userMessage", userMessage);
