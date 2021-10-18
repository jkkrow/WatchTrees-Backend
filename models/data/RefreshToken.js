const mongoose = require("mongoose");

const RefreshTokenSchema = mongoose.Schema({
  key: { type: mongoose.Types.ObjectId, required: true },
  value: { type: String, required: true },
});

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
