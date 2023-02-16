import { Router } from 'express';

import * as VideoTreeController from '../controllers/video-tree.controller';
import {
  passAccessToken,
  checkAccessToken,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.get('/client', passAccessToken, VideoTreeController.getClientVideos);
router.get(
  '/client/featured',
  passAccessToken,
  VideoTreeController.getFeaturedVideos
);
router.get('/client/:id', passAccessToken, VideoTreeController.getClientVideo);

router.get('/favorites', checkAccessToken, VideoTreeController.getFavorites);
router.patch(
  '/:id/favorites',
  checkAccessToken,
  VideoTreeController.toggleFavorites
);

router.get('/created', checkAccessToken, VideoTreeController.getCreatedVideos);
router.get(
  '/created/:id',
  checkAccessToken,
  VideoTreeController.getCreatedVideo
);

router.post(
  '/',
  checkAccessToken,
  checkVerified,
  VideoTreeController.createVideo
);
router.patch(
  '/:id',
  checkAccessToken,
  checkVerified,
  VideoTreeController.updateVideo
);
router.delete(
  '/:id',
  checkAccessToken,
  checkVerified,
  VideoTreeController.deleteVideo
);

export default router;
