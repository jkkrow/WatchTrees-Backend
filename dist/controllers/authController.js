"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.putResetPassword = exports.getResetPassword = exports.sendRecoveryEmail = exports.verifyEmail = exports.sendVerifyEmail = exports.updateAccessToken = exports.updateRefreshToken = exports.login = exports.register = void 0;
var bcrypt_1 = __importDefault(require("bcrypt"));
var crypto_1 = __importDefault(require("crypto"));
var uuid_1 = require("uuid");
var google_auth_library_1 = require("google-auth-library");
var express_validator_1 = require("express-validator");
var HttpError_1 = __importDefault(require("../models/common/HttpError"));
var User_1 = __importDefault(require("../models/data/User"));
var RefreshToken_1 = __importDefault(require("../models/data/RefreshToken"));
var jwt_token_1 = require("../services/jwt-token");
var send_email_1 = __importDefault(require("../services/send-email"));
var register = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, email, password, errors, existingEmail, hashedPassword, user, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, name_1 = _a.name, email = _a.email, password = _a.password;
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    throw new HttpError_1.default(422, 'Invalid inputs.');
                }
                return [4 /*yield*/, User_1.default.findOne({ email: email })];
            case 1:
                existingEmail = _b.sent();
                if (existingEmail) {
                    throw new HttpError_1.default(409, 'Already existing email.');
                }
                return [4 /*yield*/, bcrypt_1.default.hash(password, 12)];
            case 2:
                hashedPassword = _b.sent();
                user = new User_1.default({
                    email: email,
                    password: hashedPassword,
                    name: name_1,
                    token: {
                        type: 'verify-email',
                        value: crypto_1.default.randomBytes(20).toString('hex'),
                        expiresIn: Date.now() + 1000 * 60 * 60 * 24,
                    },
                });
                return [4 /*yield*/, user.save()];
            case 3:
                _b.sent();
                return [4 /*yield*/, (0, send_email_1.default)({
                        to: user.email,
                        subject: 'Account verification link',
                        text: "\n      Verify your email address.\n\n      You've just created new account with this email address.\n\n      Please verify your email and complete signup process.\n\n      " + process.env.CLIENT_URL + "/auth/verify-email/" + user.token.value + "\n      ",
                        html: "\n      <h3>Verify your email address</h3>\n      <p>You've just created new account with this email address.</p>\n      <p>Please verify your email and complete signup process.</p>\n      <a href=" + process.env.CLIENT_URL + "/auth/verify-email/" + user.token.value + ">Verify email</a>\n      ",
                    })];
            case 4:
                _b.sent();
                res.status(201).json({
                    message: 'Verification email has sent. Please check your email and confirm signup.',
                });
                return [3 /*break*/, 6];
            case 5:
                err_1 = _b.sent();
                return [2 /*return*/, next(err_1)];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.register = register;
var login = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, tokenId, user, correctPassword, client, result, _b, email_verified, email_1, name_2, hashedPassword, accessToken, refreshToken, storedRefreshToken, newRefreshToken, err_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 14, , 15]);
                _a = req.body, email = _a.email, password = _a.password, tokenId = _a.tokenId;
                user = void 0;
                if (!!tokenId) return [3 /*break*/, 3];
                return [4 /*yield*/, User_1.default.findOne({ email: email })];
            case 1:
                // Native login //
                user = _c.sent();
                if (!user) {
                    throw new HttpError_1.default(401, 'Invalid email or password.');
                }
                return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
            case 2:
                correctPassword = _c.sent();
                if (!correctPassword) {
                    throw new HttpError_1.default(401, 'Invalid email or password.');
                }
                return [3 /*break*/, 8];
            case 3:
                client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
                return [4 /*yield*/, client.verifyIdToken({
                        idToken: tokenId,
                        audience: process.env.GOOGLE_CLIENT_ID,
                    })];
            case 4:
                result = _c.sent();
                _b = result.getPayload(), email_verified = _b.email_verified, email_1 = _b.email, name_2 = _b.name;
                if (!email_verified) {
                    throw new HttpError_1.default(401, 'Google account not verified.');
                }
                return [4 /*yield*/, User_1.default.findOne({ email: email_1 })];
            case 5:
                user = _c.sent();
                if (!!user) return [3 /*break*/, 8];
                return [4 /*yield*/, bcrypt_1.default.hash((0, uuid_1.v1)() + email_1, 12)];
            case 6:
                hashedPassword = _c.sent();
                user = new User_1.default({
                    email: email_1,
                    password: hashedPassword,
                    name: name_2,
                    isVerified: true,
                });
                return [4 /*yield*/, user.save()];
            case 7:
                _c.sent();
                res.status(201);
                _c.label = 8;
            case 8:
                accessToken = (0, jwt_token_1.createAccessToken)({
                    userId: user._id,
                });
                refreshToken = (0, jwt_token_1.createRefreshToken)({
                    userId: user._id,
                });
                return [4 /*yield*/, RefreshToken_1.default.findOne({
                        key: user._id,
                    })];
            case 9:
                storedRefreshToken = _c.sent();
                if (!!storedRefreshToken) return [3 /*break*/, 11];
                newRefreshToken = new RefreshToken_1.default({
                    key: user._id,
                    value: refreshToken,
                });
                return [4 /*yield*/, newRefreshToken.save()];
            case 10:
                _c.sent();
                return [3 /*break*/, 13];
            case 11:
                storedRefreshToken.value = refreshToken;
                return [4 /*yield*/, storedRefreshToken.save()];
            case 12:
                _c.sent();
                _c.label = 13;
            case 13:
                res.json({
                    accessToken: accessToken,
                    refreshToken: {
                        value: refreshToken,
                        expiresIn: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    },
                    userData: {
                        email: user.email,
                        name: user.name,
                        picture: user.picture,
                        isVerified: user.isVerified,
                        isPremium: user.isPremium,
                    },
                });
                return [3 /*break*/, 15];
            case 14:
                err_2 = _c.sent();
                return [2 /*return*/, next(err_2)];
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
var updateRefreshToken = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authorization, refreshToken, decodedToken, storedToken, newAccessToken, newRefreshToken, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                authorization = req.headers.authorization;
                if (!authorization) {
                    throw new HttpError_1.default(403);
                }
                refreshToken = authorization.split(' ')[1];
                decodedToken = (0, jwt_token_1.verifyToken)(refreshToken);
                return [4 /*yield*/, RefreshToken_1.default.findOne({
                        key: decodedToken.userId,
                    })];
            case 1:
                storedToken = _a.sent();
                if (!storedToken) {
                    throw new HttpError_1.default(404);
                }
                newAccessToken = (0, jwt_token_1.createAccessToken)({
                    userId: decodedToken.userId,
                });
                newRefreshToken = (0, jwt_token_1.createRefreshToken)({
                    userId: decodedToken.userId,
                });
                storedToken.value = newRefreshToken;
                return [4 /*yield*/, storedToken.save()];
            case 2:
                _a.sent();
                res.json({
                    accessToken: newAccessToken,
                    refreshToken: {
                        value: newRefreshToken,
                        expiresIn: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                err_3 = _a.sent();
                return [2 /*return*/, next(err_3)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateRefreshToken = updateRefreshToken;
var updateAccessToken = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authorization, refreshToken, decodedToken, storedToken, newAccessToken, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authorization = req.headers.authorization;
                if (!authorization) {
                    throw new HttpError_1.default(403);
                }
                refreshToken = authorization.split(' ')[1];
                decodedToken = (0, jwt_token_1.verifyToken)(refreshToken);
                return [4 /*yield*/, RefreshToken_1.default.findOne({
                        key: decodedToken.userId,
                    })];
            case 1:
                storedToken = _a.sent();
                if (!storedToken) {
                    throw new HttpError_1.default(404);
                }
                if (storedToken.value !== refreshToken) {
                    throw new HttpError_1.default(403, 'Expired refresh token.');
                }
                newAccessToken = (0, jwt_token_1.createAccessToken)({
                    userId: decodedToken.userId,
                });
                res.json({ accessToken: newAccessToken });
                return [3 /*break*/, 3];
            case 2:
                err_4 = _a.sent();
                return [2 /*return*/, next(err_4)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateAccessToken = updateAccessToken;
var sendVerifyEmail = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var email, user, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                email = req.body.email;
                return [4 /*yield*/, User_1.default.findOne({ email: email })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new HttpError_1.default(404, 'No user found with this email. Please sign up.');
                }
                user.token = {
                    type: 'verify-email',
                    value: crypto_1.default.randomBytes(20).toString('hex'),
                    expiresIn: Date.now() + 1000 * 60 * 60,
                };
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                return [4 /*yield*/, (0, send_email_1.default)({
                        to: user.email,
                        subject: 'Account verification link',
                        text: "\n      Verify your email address.\n\n      You've just created new account with this email address.\n\n      Please verify your email and complete signup process.\n\n      " + process.env.CLIENT_URL + "/auth/verify-email/" + user.token.value + "\n      ",
                        html: "\n      <h3>Verify your email address</h3>\n      <p>You've just created new account with this email address.</p>\n      <p>Please verify your email and complete signup process.</p>\n      <a href=" + process.env.CLIENT_URL + "/auth/verify-email/" + user.token.value + ">Verify email</a>\n      ",
                    })];
            case 3:
                _a.sent();
                res.json({
                    message: 'Verification email has sent. Please check your email and confirm signup.',
                });
                return [3 /*break*/, 5];
            case 4:
                err_5 = _a.sent();
                return [2 /*return*/, next(err_5)];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.sendVerifyEmail = sendVerifyEmail;
var verifyEmail = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                token = req.params.token;
                return [4 /*yield*/, User_1.default.findOne({
                        'token.type': 'verify-email',
                        'token.value': token,
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new HttpError_1.default(404);
                }
                if (user.isVerified) {
                    return [2 /*return*/, res.json({ message: "You've already been verified." })];
                }
                if (user.token.expiresIn < Date.now()) {
                    throw new HttpError_1.default(400, 'This verification link has expired. Please send another email from Account Settings page.');
                }
                user.isVerified = true;
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                res.json({ message: 'Your account has been successfully verified.' });
                return [3 /*break*/, 4];
            case 3:
                err_6 = _a.sent();
                return [2 /*return*/, next(err_6)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.verifyEmail = verifyEmail;
var sendRecoveryEmail = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var email, user, err_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                email = req.body.email;
                return [4 /*yield*/, User_1.default.findOne({ email: email })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new HttpError_1.default(404, 'No user found with this email. Please sign up.');
                }
                user.token = {
                    type: 'reset-password',
                    value: crypto_1.default.randomBytes(20).toString('hex'),
                    expiresIn: Date.now() + 1000 * 60 * 60,
                };
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                return [4 /*yield*/, (0, send_email_1.default)({
                        to: user.email,
                        subject: 'Reset password link',
                        text: "\n      Reset your password.\n\n      You've just requested the reset of the password for your account.\n\n      Please click the following link to complete the process within one hour.\n\n      If you did not request this, please ignore this email and your password will remain unchanged.\n\n      " + process.env.CLIENT_URL + "/auth/reset-password/" + user.token.value + "\n      ",
                        html: "\n      <h3>Reset your password.</h3>\n      <p>You've just requested the reset of the password for your account.</p>\n      <p>Please click the following link to complete the process within one hour.</p>\n      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>\n      <a href=" + process.env.CLIENT_URL + "/auth/reset-password/" + user.token.value + ">Reset Password</a>\n      ",
                    })];
            case 3:
                _a.sent();
                res.json({ message: 'Recovery email has sent successfully.' });
                return [3 /*break*/, 5];
            case 4:
                err_7 = _a.sent();
                return [2 /*return*/, next(err_7)];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.sendRecoveryEmail = sendRecoveryEmail;
var getResetPassword = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, err_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                token = req.params.token;
                return [4 /*yield*/, User_1.default.findOne({
                        'token.type': 'reset-password',
                        'token.value': token,
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new HttpError_1.default(404);
                }
                if (user.token.expiresIn < Date.now()) {
                    throw new HttpError_1.default(400, 'This link has been expired. Please send another email to reset password.');
                }
                res.json();
                return [3 /*break*/, 3];
            case 2:
                err_8 = _a.sent();
                return [2 /*return*/, next(err_8)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getResetPassword = getResetPassword;
var putResetPassword = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, password, errors, user, newPassword, err_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                token = req.params.token;
                password = req.body.password;
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    throw new HttpError_1.default(422, 'Invalid inputs.');
                }
                return [4 /*yield*/, User_1.default.findOne({
                        'token.type': 'reset-password',
                        'token.value': token,
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new HttpError_1.default(404);
                }
                if (user.token.expiresIn < Date.now()) {
                    throw new HttpError_1.default(400, 'This link has been expired. Please send another email to reset password.');
                }
                return [4 /*yield*/, bcrypt_1.default.hash(password, 12)];
            case 2:
                newPassword = _a.sent();
                user.password = newPassword;
                return [4 /*yield*/, user.save()];
            case 3:
                _a.sent();
                res.json({ message: 'Password has changed successfully.' });
                return [3 /*break*/, 5];
            case 4:
                err_9 = _a.sent();
                return [2 /*return*/, next(err_9)];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.putResetPassword = putResetPassword;
