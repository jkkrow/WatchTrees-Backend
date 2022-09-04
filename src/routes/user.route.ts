import { Router } from 'express';
import { body } from 'express-validator';

import * as UserController from '../controllers/user.controller';
import {
  checkAccessToken,
  checkRefreshToken,
} from '../middlewares/auth.middleware';

const router = Router();

// Signup & Signin
router.post('/signin', UserController.signin);
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 4 }),
    body('email').normalizeEmail().isEmail(),
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  UserController.signup
);

// Email Verification
router.post('/verification', UserController.sendVerification);
router.get('/verification/:token', UserController.checkVerification);

// Reset Password
router.post('/recovery', UserController.sendRecovery);
router.get('/recovery/:token', UserController.checkRecovery);
router.patch(
  '/recovery/:token/password',
  [
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  UserController.resetPassword
);

// Get Token & User Data
router.get(
  '/refresh-token',
  checkRefreshToken,
  UserController.updateRefreshToken
);
router.get(
  '/access-token',
  checkRefreshToken,
  UserController.updateAccessToken
);
router.get('/data', checkAccessToken, UserController.getUserData);

// Update User
router.patch(
  '/name',
  checkAccessToken,
  [body('name').trim().isLength({ min: 4 })],
  UserController.updateUserName
);
router.patch(
  '/password',
  checkAccessToken,
  [
    body('currentPassword').trim().notEmpty(),
    body('newPassword').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.newPassword
    ),
  ],
  UserController.updatePassword
);
router.patch('/picture', checkAccessToken, UserController.updatePicture);

// Channel
router.get('/channel/:id', UserController.getChannel);

// Subscribe
router.get('/subscribes', checkAccessToken, UserController.getSubscribes);
router.get('/subscribers', checkAccessToken, UserController.getSubscribers);
router.patch(
  '/:id/subscribers',
  checkAccessToken,
  UserController.updateSubscribers
);

// Delete user
router.post('/deletion', checkAccessToken, UserController.deleteAccount);

export default router;
