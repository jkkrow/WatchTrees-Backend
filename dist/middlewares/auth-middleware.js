"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var HttpError_1 = __importDefault(require("models/common/HttpError"));
var jwt_token_1 = require("services/jwt-token");
var authMiddleware = function (req, res, next) {
    if (req.method === 'OPTIONS')
        return next();
    try {
        var authorization = req.headers.authorization;
        if (!authorization) {
            throw new HttpError_1.default(403);
        }
        var token = authorization.split(' ')[1];
        var decodedToken = (0, jwt_token_1.verifyToken)(token);
        req.user = { id: decodedToken.userId };
        next();
    }
    catch (err) {
        return next(err);
    }
};
exports.default = authMiddleware;
