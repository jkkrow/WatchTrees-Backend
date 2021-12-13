import { Router } from 'express';
import { body } from 'express-validator';

import * as userController from '../controllers/userController';
import { checkToken } from '../middlewares/auth-middleware';

const router = Router();

router.get('/channel/:id', userController.fetchChannel);
router.patch(
  '/channel/subscribers/:id',
  checkToken,
  userController.subscribeChannel
);

router.patch(
  '/account/name',
  checkToken,
  [body('name').trim().isLength({ min: 4 })],
  userController.updateUserName
);
router.patch(
  '/account/password',
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
router.patch('/account/picture', checkToken, userController.updatePicture);

// router.get('/history', checkToken, userController.fetchHistory);

router.get('/subscribes', checkToken, userController.fetchSubscribes);

router.get('/favorites', checkToken, userController.fetchFavorites);
router.patch('/favorites', checkToken, userController.addToFavorites);

export default router;
