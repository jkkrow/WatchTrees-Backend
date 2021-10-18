const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  root: {
    id: { type: String, required: true },
    layer: { type: Number, required: false },
    info: { type: Object, required: true },
    children: { type: Array, required: true },
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: Array, required: true },
  size: { type: Number, required: true },
  maxDuration: { type: Number, required: true },
  minDuration: { type: Number, required: true },
  status: { type: String, required: true },
});

module.exports = mongoose.model("Video", VideoSchema);
