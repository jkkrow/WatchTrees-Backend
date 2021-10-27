"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var UserSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: { type: String, default: '' },
    isVerified: { type: Boolean, required: true, default: false },
    isPremium: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, required: true, default: false },
    token: {
        type: { type: String },
        value: { type: String },
        expiresIn: { type: Number },
    },
    videos: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Video' }],
});
exports.default = mongoose_1.default.model('User', UserSchema);
