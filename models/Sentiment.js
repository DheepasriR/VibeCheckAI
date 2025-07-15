const mongoose = require("mongoose");

const SentimentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  text: String,
  score: Number,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sentiment", SentimentSchema);
