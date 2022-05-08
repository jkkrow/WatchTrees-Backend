import { Router } from 'express';

import * as VideoController from '../controllers/video.controller';
import { checkToken, checkVerified } from '../middlewares/auth.middleware';

const router = Router();

router.get('/client', VideoController.getClientVideos);
router.get('/:id/client', VideoController.getClientVideo);

router.get('/favorites', checkToken, VideoController.getFavorites);
router.patch('/:id/favorites', checkToken, VideoController.toggleFavorites);

router.post(
  '/upload/multipart',
  checkToken,
  checkVerified,
  VideoController.initiateVideoUpload
);
router.put(
  '/upload/multipart/:uploadId',
  checkToken,
  VideoController.processVideoUpload
);
router.post(
  '/upload/multipart/:uploadId',
  checkToken,
  VideoController.completeVideoUpload
);
router.delete(
  '/upload/multipart/:uploadId',
  checkToken,
  VideoController.cancelVideoUpload
);

router.patch('/upload/thumbnail', checkToken, VideoController.uploadThumbnail);

router.get('/created', checkToken, VideoController.getCreatedVideos);
router.get('/created/:id', checkToken, VideoController.getCreatedVideo);

router.post('/', checkToken, checkVerified, VideoController.createVideo);
router.patch('/:id', checkToken, checkVerified, VideoController.updateVideo);
router.delete('/:id', checkToken, checkVerified, VideoController.deleteVideo);

export default router;
