"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createRefreshToken = exports.createAccessToken = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var createAccessToken = function (payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_KEY, { expiresIn: '15m' });
};
exports.createAccessToken = createAccessToken;
var createRefreshToken = function (payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_KEY, { expiresIn: '7d' });
};
exports.createRefreshToken = createRefreshToken;
var verifyToken = function (token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
};
exports.verifyToken = verifyToken;
