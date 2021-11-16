import { Router } from 'express';

import * as userController from '../controllers/userController';
import { checkToken } from '../middlewares/auth-middleware';

const router = Router();

router.get('/videos', checkToken, userController.fetchVideos);

export default router;
