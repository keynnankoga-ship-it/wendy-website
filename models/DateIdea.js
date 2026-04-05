const mongoose = require("mongoose")

const DateIdeaSchema = new mongoose.Schema({

title:String,

description:String,

photos:[String]

})

module.exports = mongoose.model("DateIdea",DateIdeaSchema)