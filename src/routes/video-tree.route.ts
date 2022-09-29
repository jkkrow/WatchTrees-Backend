import { Router } from 'express';

import * as VideoTreeController from '../controllers/video-tree.controller';
import {
  checkAccessToken,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.get('/client', VideoTreeController.getClientVideos);
router.get('/client/featured', VideoTreeController.getFeaturedVideos);
router.get('/client/:id', VideoTreeController.getClientVideo);

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
