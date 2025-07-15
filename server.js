const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Sentiment = require("sentiment");
const path = require("path");
const dotenv = require("dotenv");
const User = require("./models/User");
const SentimentModel = require("./models/Sentiment");
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const sentiment = new Sentiment();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login.html");
}

app.get("/", isAuthenticated, async (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/register", (req, res) => {
  res.redirect("/register.html");
});

app.get("/login", (req, res) => {
  res.redirect("/login.html");
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hash });
  res.redirect("/login.html");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user._id;
    res.redirect("/");
  } else {
    res.send("Invalid login");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

app.post("/analyze", isAuthenticated, async (req, res) => {
  const { text } = req.body;
  const result = sentiment.analyze(text);

  let sentimentType = "Neutral";
  let emoji = "🙂";
  let explanation = "The sentiment is neutral.";

  if (result.score > 0) {
    sentimentType = "Positive";
    emoji = "😊";
    explanation =
      "The sentiment is positive, expressing good or happy feelings.";
  } else if (result.score < 0) {
    sentimentType = "Negative";
    emoji = "😞";
    explanation = "The sentiment is negative, showing sadness or displeasure.";
  }

  const saved = await SentimentModel.create({
    userId: req.session.userId,
    text,
    score: result.score,
  });

  const allResults = await SentimentModel.find({
    userId: req.session.userId,
  }).sort({ date: -1 });

  res.json({
    sentimentType,
    emoji,
    explanation,
    allResults,
  });
});

app.get("/history", isAuthenticated, async (req, res) => {
  try {
    const allResults = await SentimentModel.find({
      userId: req.session.userId,
    }).sort({ date: -1 });

    res.json({ allResults });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch sentiment history" });
  }
});

app.listen(PORT, () => {
  console.log(` VibeCheck AI is running at: http://localhost:${PORT}`);
});
