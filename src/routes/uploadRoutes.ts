import { Router } from 'express';

import * as uploadController from '../controllers/uploadController';
import authMiddleware from '../middlewares/auth-middleware';

const router = Router();

router.get('/initiate-upload', authMiddleware, uploadController.initiateUpload);
router.get('/get-upload-url', authMiddleware, uploadController.getUploadUrl);
router.post(
  '/complete-upload',
  authMiddleware,
  uploadController.completeUpload
);
// router.post('/save-upload', authMiddleware, uploadController.saveUpload);

export default router;
