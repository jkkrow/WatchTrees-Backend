import { Router } from 'express';

import * as VideoController from '../controllers/video.controller';
import {
  checkAccessToken,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.get('/client', VideoController.getClientVideos);
router.get('/client/featured', VideoController.getFeaturedVideos);
router.get('/client/:id', VideoController.getClientVideo);

router.get('/favorites', checkAccessToken, VideoController.getFavorites);
router.patch(
  '/:id/favorites',
  checkAccessToken,
  VideoController.toggleFavorites
);

router.get('/created', checkAccessToken, VideoController.getCreatedVideos);
router.get('/created/:id', checkAccessToken, VideoController.getCreatedVideo);

router.post('/', checkAccessToken, checkVerified, VideoController.createVideo);
router.patch(
  '/:id',
  checkAccessToken,
  checkVerified,
  VideoController.updateVideo
);
router.delete(
  '/:id',
  checkAccessToken,
  checkVerified,
  VideoController.deleteVideo
);

export default router;
