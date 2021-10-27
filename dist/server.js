"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
require("dotenv/config");
var db_1 = __importDefault(require("config/db"));
var HttpError_1 = __importDefault(require("models/common/HttpError"));
var videoRoutes_1 = __importDefault(require("routes/videoRoutes"));
var uploadRoutes_1 = __importDefault(require("routes/uploadRoutes"));
var authRoutes_1 = __importDefault(require("routes/authRoutes"));
var error_middleware_1 = __importDefault(require("middlewares/error-middleware"));
// Server and DB Setups
(0, db_1.default)();
var PORT = process.env.PORT || 5000;
var app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Routes
app.use('/api/video', videoRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use(function () {
    throw new HttpError_1.default(404);
});
app.use(error_middleware_1.default);
app.listen(PORT, function () {
    console.log("Server running on port " + PORT);
});
