import { Router } from 'express';
import { body } from 'express-validator';

import * as userController from '../controllers/user.controller';
import { checkToken } from '../middlewares/auth.middleware';

const router = Router();

// Signup & Signin
router.post('/signin', userController.signin);
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
  userController.signup
);

// Email Verification
router.post('/verification', userController.sendVerification);
router.get('/verification/:token', userController.checkVerification);

// Reset Password
router.post('/recovery', userController.sendRecovery);
router.get('/recovery/:token', userController.checkRecovery);
router.patch(
  '/recovery/:token/password',
  [
    body('password').trim().isStrongPassword(),
    body('confirmPassword').custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  userController.resetPassword
);

// Get Token
router.get('/refresh-token', checkToken, userController.updateRefreshToken);
router.get('/access-token', checkToken, userController.updateAccessToken);

// Update User
router.patch(
  '/name',
  checkToken,
  [body('name').trim().isLength({ min: 4 })],
  userController.updateUserName
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
  userController.updatePassword
);
router.patch('/picture', checkToken, userController.updatePicture);

// Channel
router.get('/:id/channel', userController.getChannel);

// Subscribe
router.get('/subscribes', checkToken, userController.getSubscribes);
router.patch('/:id/subscribers', checkToken, userController.updateSubscribers);

export default router;
