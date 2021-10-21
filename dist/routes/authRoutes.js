"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var authController = __importStar(require("../controllers/authController"));
var router = (0, express_1.Router)();
// Signup & Signin
router.post('/login', authController.login);
router.post('/register', [
    (0, express_validator_1.body)('name').trim().isLength({ min: 4 }),
    (0, express_validator_1.body)('email').normalizeEmail().isEmail(),
    (0, express_validator_1.body)('password').trim().isStrongPassword(),
    (0, express_validator_1.body)('confirmPassword').custom(function (value, _a) {
        var req = _a.req;
        return value === req.body.password;
    }),
], authController.register);
// Update Token
router.get('/refresh-token', authController.updateRefreshToken);
router.get('/access-token', authController.updateAccessToken);
// Email Verification
router.post('/send-verify-email', authController.sendVerifyEmail);
router.get('/verify-email/:token', authController.verifyEmail);
// Reset Password
router.post('/send-recovery-email', authController.sendRecoveryEmail);
router.get('/reset-password/:token', authController.getResetPassword);
router.put('/reset-password/:token', [
    (0, express_validator_1.body)('password').trim().isStrongPassword(),
    (0, express_validator_1.body)('confirmPassword').custom(function (value, _a) {
        var req = _a.req;
        return value === req.body.password;
    }),
], authController.putResetPassword);
exports.default = router;
