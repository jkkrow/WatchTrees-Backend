const HttpError = require("../models/common/HttpError");
const { verifyToken } = require("../services/jwt-token");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      throw new HttpError(403);
    }

    const decodedToken = verifyToken(token);

    req.user = { id: decodedToken.userId };

    next();
  } catch (err) {
    return next(err);
  }
};
