import { Router } from 'express';

import { checkToken, checkVerified } from '../middlewares/auth.middleware';
import * as videoController from '../controllers/video.controller';

const router = Router();

router.get('/client', videoController.getClientVideos);
router.get('/client/:id', videoController.getClientVideo);

router.get('/favorites', checkToken, videoController.getFavorites);
router.patch('/favorites', checkToken, videoController.toggleFavorites);

router.post(
  '/upload/multipart',
  checkToken,
  checkVerified,
  videoController.initiateVideoUpload
);
router.put(
  '/upload/multipart/:uploadId',
  checkToken,
  videoController.processVideoUpload
);
router.post(
  '/upload/multipart/:uploadId',
  checkToken,
  videoController.completeVideoUpload
);
router.delete(
  '/upload/multipart/:uploadId',
  checkToken,
  videoController.cancelVideoUpload
);
router.put('/upload/thumbnail', checkToken, videoController.uploadThumbnail);
router.delete('/upload/thumbnail', checkToken, videoController.deleteThumbnail);

router.get('/', checkToken, videoController.getCreatedVideos);
router.post('/', checkToken, checkVerified, videoController.createVideo);

router.get('/:id', checkToken, videoController.getCreatedVideo);
router.patch('/:id', checkToken, checkVerified, videoController.updateVideo);
router.delete('/:id', checkToken, checkVerified, videoController.deleteVideo);

export default router;
