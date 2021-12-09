import { Router } from 'express';

import { checkToken, checkVerified } from '../middlewares/auth-middleware';
import * as videoController from '../controllers/videoController';

const router = Router();

router.get('/', videoController.fetchPublicVideos);
router.get('/user', checkToken, videoController.fetchCreatedVideos);
router.get('/user/:id', checkToken, videoController.fetchCreatedVideo);
router.get('/:id', videoController.fetchPublicVideo);
router.put('/:id', checkToken, checkVerified, videoController.saveVideo);
router.delete('/:id', checkToken, checkVerified, videoController.deleteVideo);
router.patch('/:id/favorites', checkToken, videoController.addToFavorites);

export default router;
