import { Router } from 'express';

import { checkToken, checkVerified } from '../middlewares/auth-middleware';
import * as videoController from '../controllers/videoController';

const router = Router();

router.get('/', videoController.fetchVideos);
router.get('/user', checkToken, videoController.fetchCreatedVideos);
router.put('/:id', checkToken, checkVerified, videoController.saveVideo);
router.delete('/:id', checkToken, checkVerified, videoController.deleteVideo);

export default router;
