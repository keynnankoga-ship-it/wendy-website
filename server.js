require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const twilio = require("twilio");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   SESSION
========================= */
app.use(session({
  secret: process.env.ADMIN_PASS,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

/* =========================
   DATABASE
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* =========================
   MODELS
========================= */
const Song = mongoose.model("Song", { title: String, artist: String, audio: String, cover: String, createdAt: { type: Date, default: Date.now } });
const Gallery = mongoose.model("Gallery", { url: String, createdAt: { type: Date, default: Date.now } });
const DateIdea = mongoose.model("DateIdea", { title: String, description: String, createdAt: { type: Date, default: Date.now } });
const Playlist = mongoose.model("Playlist", { embed: String, createdAt: { type: Date, default: Date.now } });
const Subscription = mongoose.model("Subscription", { name: String, email: String, phone: String, createdAt: { type: Date, default: Date.now } });
const Affirmation = mongoose.model("Affirmation", { text: String, createdAt: { type: Date, default: Date.now } });

/* =========================
   ADMIN AUTH
========================= */
function adminAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "Unauthorized" });
}

/* =========================
   ADMIN LOGIN
========================= */
app.post("/admin-login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});

app.get("/admin-check", (req, res) => {
  if (req.session && req.session.admin) return res.json({ logged: true });
  res.json({ logged: false });
});

app.post("/admin-logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

/* =========================
   CRUD ROUTES (Affirmations, Songs, Gallery, DateIdeas, Playlists)
========================= */
app.get("/affirmations", async (req, res) => res.json(await Affirmation.find().sort({ createdAt: -1 })));
app.post("/admin/add-affirmation", adminAuth, async (req, res) => { await new Affirmation(req.body).save(); res.json({ success: true }); });
app.delete("/admin/delete-affirmation/:id", adminAuth, async (req, res) => { await Affirmation.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get("/songs", async (req, res) => res.json(await Song.find().sort({ createdAt: -1 })));
app.post("/admin/add-song", adminAuth, async (req, res) => { await new Song(req.body).save(); res.json({ success: true }); });
app.delete("/admin/delete-song/:id", adminAuth, async (req, res) => { await Song.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.get("/song-of-the-day", async (req, res) => {
  const songs = await Song.find();
  if (!songs.length) return res.json({});
  res.json(songs[new Date().getDate() % songs.length]);
});

app.get("/gallery", async (req, res) => res.json(await Gallery.find().sort({ createdAt: -1 })));
app.post("/admin/add-photo", adminAuth, async (req, res) => { await new Gallery(req.body).save(); res.json({ success: true }); });
app.delete("/admin/delete-photo/:id", adminAuth, async (req, res) => { await Gallery.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get("/dateIdeas", async (req, res) => res.json(await DateIdea.find().sort({ createdAt: -1 })));
app.post("/admin/add-date", adminAuth, async (req, res) => { await new DateIdea(req.body).save(); res.json({ success: true }); });
app.delete("/admin/delete-date/:id", adminAuth, async (req, res) => { await DateIdea.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get("/playlists", async (req, res) => res.json(await Playlist.find().sort({ createdAt: -1 })));
app.post("/admin/add-playlist", adminAuth, async (req, res) => { await new Playlist(req.body).save(); res.json({ success: true }); });
app.delete("/admin/delete-playlist/:id", adminAuth, async (req, res) => { await Playlist.findByIdAndDelete(req.params.id); res.json({ success: true }); });

/* =========================
   SUBSCRIBE
========================= */
app.post("/subscribe", async (req, res) => {
  const { name, email, phone } = req.body;
  if (!email && !phone) return res.status(400).json({ error: "Email or phone required" });

  const exists = await Subscription.findOne({ $or: [{ email }, { phone }] });
  if (!exists) await new Subscription({ name, email, phone }).save();

  res.json({ success: true, message: "Subscribed successfully!" });
});

app.get("/admin/subscriptions", adminAuth, async (req, res) => {
  res.json(await Subscription.find().sort({ createdAt: -1 }));
});

/* =========================
   EMAIL CONFIG (FOR IPv4)
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  family: 4 // force IPv4
});

/* =========================
   TWILIO CONFIG
========================= */
let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
}

/* =========================
   SEND DAILY AFFIRMATIONS
========================= */
async function sendDailyAffirmations() {
  const subscribers = await Subscription.find();
  const affirmations = await Affirmation.find().sort({ createdAt: -1 });
  if (!affirmations.length) return;

  const todayAffirmation = affirmations[new Date().getDate() % affirmations.length].text;

  for (const sub of subscribers) {
    if (sub.email) {
      try {
        await transporter.sendMail({
          from: `"Daily Affirmation" <${process.env.EMAIL_USER}>`,
          to: sub.email,
          subject: "Your Daily Affirmation ❤️",
          text: todayAffirmation
        });
        console.log("Email sent to:", sub.email);
      } catch (err) {
        console.log("Email failed:", err.message);
      }
    }
    if (sub.phone && twilioClient && process.env.TWILIO_PHONE) {
      try {
        await twilioClient.messages.create({
          body: todayAffirmation,
          from: process.env.TWILIO_PHONE,
          to: sub.phone
        });
        console.log("SMS sent to:", sub.phone);
      } catch (err) {
        console.log("SMS failed:", err.message);
      }
    }
  }

  console.log("Daily affirmation sending process finished");
}

/* =========================
   CRON SCHEDULE
========================= */
cron.schedule("0 8 * * *", () => sendDailyAffirmations().catch(console.error), { timezone: "Africa/Nairobi" });

/* =========================
   TEST ROUTE
========================= */
app.get("/test-affirmation", async (req, res) => {
  try {
    await sendDailyAffirmations();
    res.json({ success: true, message: "Affirmations sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send affirmations" });
  }
});

/* =========================
   FIREBASE CONFIG
========================= */
app.get("/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_PROJECT_ID + ".firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    vapidKey: process.env.FIREBASE_VAPID_KEY
  });
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));