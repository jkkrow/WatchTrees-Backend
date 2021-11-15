import { Router } from 'express';

import authMiddleware from '../middlewares/auth-middleware';
import * as videoController from '../controllers/videoController';

const router = Router();

router.put('/:id', authMiddleware, videoController.saveVideo);
router.delete('/:id', authMiddleware, videoController.deleteVideo);

export default router;
