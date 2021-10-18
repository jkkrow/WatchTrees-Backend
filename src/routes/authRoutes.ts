import { Router } from 'express';
import { body } from 'express-validator';

import * as authController from '../controllers/authController';

const router = Router();

// Signup & Signin
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 4 }),
    body('email').normalizeEmail().isEmail(),
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  authController.register
);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

// Update Token
router.get('/update-refresh-token', authController.updateRefreshToken);
router.get('/update-access-token', authController.updateAccessToken);

// Email Verification
router.post('/send-verify-email', authController.sendVerifyEmail);
router.get('/verify-email/:token', authController.verifyEmail);

// Reset Password
router.post('/send-recovery-email', authController.sendRecoveryEmail);
router.get('/reset-password/:token', authController.getResetPassword);
router.put(
  '/reset-password/:token',
  [
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  authController.putResetPassword
);

export default router;
