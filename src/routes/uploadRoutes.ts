import { Router } from 'express';

import * as uploadController from '../controllers/uploadController';
import { checkToken, checkVerified } from '../middlewares/auth-middleware';

const router = Router();

router.get(
  '/multipart-id',
  checkToken,
  checkVerified,
  uploadController.initiateMultipart
);
router.get(
  '/multipart-presigned-url',
  checkToken,
  checkVerified,
  uploadController.processMultipart
);
router.post(
  '/multipart-parts',
  checkToken,
  checkVerified,
  uploadController.completeMultipart
);

router.put(
  '/thumbnail',
  checkToken,
  checkVerified,
  uploadController.uploadThumbnail
);
router.delete(
  '/thumbnail',
  checkToken,
  checkVerified,
  uploadController.deleteThumbnail
);

export default router;
