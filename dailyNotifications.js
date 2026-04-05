require("dotenv").config();
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

/* =========================
   MongoDB Setup
========================= */
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

/* =========================
   Models
========================= */
const Affirmation = mongoose.model("Affirmation", new mongoose.Schema({ text: String }));
const Song = mongoose.model("Song", new mongoose.Schema({
  title: String,
  artist: String,
  cover: String,
  audio: String
}));

const Subscriber = mongoose.model("Subscriber", new mongoose.Schema({
  token: String,
  createdAt: { type: Date, default: Date.now }
}));

/* =========================
   Firebase Setup
========================= */
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* =========================
   Utility Functions
========================= */

// Get daily affirmation
async function getDailyAffirmation() {
  const affirmations = await Affirmation.find();
  if (!affirmations.length) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % affirmations.length;
  return affirmations[index];
}

// Get daily song
async function getDailySong() {
  const songs = await Song.find();
  if (!songs.length) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % songs.length;
  return songs[index];
}

/* =========================
   Send Notifications
========================= */
async function sendDailyNotifications() {
  try {
    const subscribers = await Subscriber.find();
    if (!subscribers.length) return console.log("No subscribers to notify");

    const affirmation = await getDailyAffirmation();
    const song = await getDailySong();

    const payload = {
      notification: {
        title: "❤️ Daily Inspiration",
        body: `${affirmation ? affirmation.text : ""}\n🎵 Today's Song: ${song ? song.title + " by " + song.artist : ""}`,
        image: song ? song.cover : undefined
      },
      data: {
        songAudio: song ? song.audio : "",
        songCover: song ? song.cover : ""
      }
    };

    const tokens = subscribers.map(s => s.token);

    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log(`Notifications sent to ${tokens.length} subscribers ✅`, response);

  } catch (err) {
    console.error("Error sending notifications:", err);
  }
}

/* =========================
   Scheduler (daily at 8am server time)
========================= */
const schedule = require("node-schedule");

// This schedules the job at 8:00 AM every day
schedule.scheduleJob("0 8 * * *", () => {
  console.log("Running daily notifications job...");
  sendDailyNotifications();
});

// Run immediately if you want to test
// sendDailyNotifications();