import { Router } from 'express';

import { checkToken, checkVerified } from '../middlewares/auth-middleware';
import * as videoController from '../controllers/videoController';

const router = Router();

router.get('/client', videoController.getClientVideos);
router.get('/client/:id', videoController.getClientVideo);

router.get('/history', checkToken, videoController.getHistory);
router.patch('/history', checkToken, videoController.addToHistory);
router.delete('/history', checkToken, videoController.removeFromHistory);

router.get('/history-local', videoController.getLocalHistory);

router.get('/favorites', checkToken, videoController.getFavorites);
router.patch('/favorites', checkToken, videoController.toggleFavorites);

router.get('/', checkToken, videoController.getVideos);
router.post('/', checkToken, checkVerified, videoController.createVideo);

router.get('/:id', checkToken, videoController.getVideo);
router.patch('/:id', checkToken, checkVerified, videoController.updateVideo);
router.delete('/:id', checkToken, checkVerified, videoController.deleteVideo);

export default router;
