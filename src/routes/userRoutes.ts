import { Router } from 'express';
import { body } from 'express-validator';

import * as userController from '../controllers/userController';
import { checkToken } from '../middlewares/auth-middleware';

const router = Router();

router.get('/videos', checkToken, userController.fetchVideos);
router.get('/history', checkToken, userController.fetchHistory);

router.patch(
  '/account/name',
  [body('name').trim().isLength({ min: 4 })],
  userController.updateUserName
);
router.patch('/account/password', [
  body('password').trim().isStrongPassword(),
  body('confirmPassword').custom(
    (value, { req }) => value === req.body.password
  ),
]);

export default router;
