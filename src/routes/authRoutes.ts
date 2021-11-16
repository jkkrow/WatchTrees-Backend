import { Router } from 'express';
import { body } from 'express-validator';

import * as authController from '../controllers/authController';
import { checkToken } from '../middlewares/auth-middleware';

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
router.post('/verification', authController.sendVerification);
router.get('/verification/:token', authController.checkVerification);

// Reset Password
router.post('/recovery', authController.sendRecovery);
router.get('/recovery/:token', authController.checkRecovery);
router.patch(
  '/recovery/:token/password',
  [
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  authController.resetPassword
);

// Update Token
router.get('/refresh-token', checkToken, authController.updateRefreshToken);
router.get('/access-token', checkToken, authController.updateAccessToken);

export default router;
