const jwt = require("jsonwebtoken");

exports.createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "15m" });
};

exports.createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "7d" });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_KEY);
};
