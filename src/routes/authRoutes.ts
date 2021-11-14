import { Router } from 'express';
import { body } from 'express-validator';

import * as authController from '../controllers/authController';
import authMiddleware from '../middlewares/auth-middleware';

const router = Router();

// Signup & Signin
router.post('/login', authController.login);
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

// Email Verification
router.post('/send-verify-email', authController.sendVerifyEmail);
router.get('/verify-email/:token', authController.verifyEmail);

// Reset Password
router.post('/send-recovery-email', authController.sendRecoveryEmail);
router.get('/user-password/:token', authController.getResetPassword);
router.patch(
  '/user-password/:token',
  [
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  authController.putResetPassword
);

// Update Token
router.get('/refresh-token', authMiddleware, authController.updateRefreshToken);
router.get('/access-token', authMiddleware, authController.updateAccessToken);

export default router;
