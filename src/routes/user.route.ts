import { Router } from 'express';
import { body } from 'express-validator';

import * as UserController from '../controllers/user.controller';
import { checkToken } from '../middlewares/auth.middleware';

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

// Get Token
router.get('/refresh-token', checkToken, UserController.updateRefreshToken);
router.get('/access-token', checkToken, UserController.updateAccessToken);

// Update User
router.patch(
  '/name',
  checkToken,
  [body('name').trim().isLength({ min: 4 })],
  UserController.updateUserName
);
router.patch(
  '/password',
  checkToken,
  [
    body('currentPassword').trim().notEmpty(),
    body('newPassword').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.newPassword
    ),
  ],
  UserController.updatePassword
);
router.patch('/picture', checkToken, UserController.updatePicture);

// Channel
router.get('/channel/:id', UserController.getChannel);

// Subscribe
router.get('/subscribes', checkToken, UserController.getSubscribes);
router.get('/subscribers', checkToken, UserController.getSubscribers);
router.patch('/:id/subscribers', checkToken, UserController.updateSubscribers);

// Delete user
router.delete('/account', checkToken, UserController.deleteAccount);

export default router;
