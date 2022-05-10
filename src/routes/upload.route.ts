import { Router } from 'express';

import * as UploadController from '../controllers/upload.controller';
import { checkToken, checkVerified } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/multipart',
  checkToken,
  checkVerified,
  UploadController.initiateMultipartUpload
);
router.put(
  '/multipart/:uploadId',
  checkToken,
  UploadController.processMultipartUpload
);
router.post(
  '/multipart/:uploadId',
  checkToken,
  UploadController.completeMultipartUpload
);
router.delete(
  '/multipart/:uploadId',
  checkToken,
  UploadController.cancelMultipartUpload
);

router.put('/image', checkToken, checkVerified, UploadController.uploadImage);
router.delete(
  '/image',
  checkToken,
  checkVerified,
  UploadController.deleteImage
);

export default router;
