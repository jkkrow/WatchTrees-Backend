import { Router } from 'express';

import { checkToken, checkVerified } from '../middlewares/auth-middleware';
import * as videoController from '../controllers/videoController';

const router = Router();

router.get('/user', checkToken, videoController.fetchCreatedVideos);
router.get('/user/:id', checkToken, videoController.fetchCreatedVideo);

router.get('/', videoController.fetchPublicVideos);
router.get('/:id', videoController.fetchVideo);

router.put('/', checkToken, checkVerified, videoController.saveVideo);
router.delete('/:id', checkToken, checkVerified, videoController.deleteVideo);

export default router;
