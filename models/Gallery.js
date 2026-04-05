const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  url: String,
  uploadedAt: Date
});

module.exports = mongoose.model("GalleryPhoto", gallerySchema);