import { Router } from 'express';

import * as userController from '../controllers/userController';
import authMiddleware from '../middlewares/auth-middleware';

const router = Router();

router.get('/videos', authMiddleware, userController.fetchVideos);

export default router;
