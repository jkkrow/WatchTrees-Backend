const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  picture: { type: String, default: "" },
  isVerified: { type: Boolean, required: true, default: false },
  isPremium: { type: Boolean, required: true, default: false },
  isAdmin: { type: Boolean, required: true, default: false },
  token: {
    type: { type: String },
    value: { type: String },
    expiresIn: { type: Date },
  },
  videos: [{ type: mongoose.Types.ObjectId, ref: "Video" }],
});

module.exports = mongoose.model("User", UserSchema);
