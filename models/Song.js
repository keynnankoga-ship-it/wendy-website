const mongoose = require("mongoose")

const SongSchema = new mongoose.Schema({

title:String,
artist:String,
reason:String,
file:String,
cover:String

})

module.exports = mongoose.model("Song",SongSchema)