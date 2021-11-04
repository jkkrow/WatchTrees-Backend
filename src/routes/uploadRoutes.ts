import { Router } from 'express';

import * as uploadController from '../controllers/uploadController';
import authMiddleware from '../middlewares/auth-middleware';

const router = Router();

router.get(
  '/video-initiate',
  authMiddleware,
  uploadController.initiateMultipart
);
router.get('/video-url', authMiddleware, uploadController.processMultipart);
router.post(
  '/video-complete',
  authMiddleware,
  uploadController.completeMultipart
);

router.get('/image', authMiddleware, uploadController.uploadImage);

router.post('/save-upload', authMiddleware, uploadController.saveUpload);

export default router;
