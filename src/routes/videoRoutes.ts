import { Router } from 'express';

import { checkToken, checkVerified } from '../middlewares/auth-middleware';
import * as videoController from '../controllers/videoController';

const router = Router();

router.get('/', videoController.fetchPublicVideos);
router.put('/', checkToken, checkVerified, videoController.saveVideo);

router.get('/user', checkToken, videoController.fetchCreatedVideos);
router.get('/user/:id', checkToken, videoController.fetchCreatedVideo);

router.get('/history', checkToken, videoController.fetchHistory);
router.patch('/history', checkToken, videoController.addToHistory);
router.delete('/history', checkToken, videoController.removeFromHistory);

router.get('/history-local', videoController.fetchLocalHistory);

router.get('/favorites', checkToken, videoController.fetchFavorites);
router.patch('/favorites', checkToken, videoController.toggleFavorites);

router.get('/:id', videoController.fetchVideo);
router.delete('/:id', checkToken, videoController.deleteVideo);

export default router;
