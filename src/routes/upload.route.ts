import { Router } from 'express';

import * as UploadController from '../controllers/upload.controller';
import {
  checkAccessToken,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/multipart',
  checkAccessToken,
  checkVerified,
  UploadController.initiateMultipartUpload
);
router.put(
  '/multipart/:uploadId',
  checkAccessToken,
  UploadController.processMultipartUpload
);
router.post(
  '/multipart/:uploadId',
  checkAccessToken,
  UploadController.completeMultipartUpload
);
router.delete(
  '/multipart/:uploadId',
  checkAccessToken,
  UploadController.cancelMultipartUpload
);

router.put(
  '/image',
  checkAccessToken,
  checkVerified,
  UploadController.uploadImage
);
router.delete(
  '/image',
  checkAccessToken,
  checkVerified,
  UploadController.deleteImage
);

export default router;
