"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoStatus = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var VideoStatus;
(function (VideoStatus) {
    VideoStatus["Progressing"] = "Progressing";
    VideoStatus["Completed"] = "Completed";
})(VideoStatus = exports.VideoStatus || (exports.VideoStatus = {}));
var VideoSchema = new mongoose_1.default.Schema({
    root: {
        id: { type: String, required: true },
        layer: { type: Number, required: false },
        info: { type: Object, required: true },
        children: { type: Array, required: true },
    },
    title: { type: String },
    description: { type: String },
    tags: [{ type: String }],
    size: { type: Number, required: true },
    maxDuration: { type: Number, required: true },
    minDuration: { type: Number, required: true },
    status: { type: String, required: true },
});
exports.default = mongoose_1.default.model('Video', VideoSchema);
