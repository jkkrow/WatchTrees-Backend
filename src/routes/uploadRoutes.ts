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
router.get('/multipart-url', checkToken, uploadController.processMultipart);
router.post('/multipart-parts', checkToken, uploadController.completeMultipart);

router.put('/thumbnail', checkToken, uploadController.uploadThumbnail);
router.delete('/thumbnail', checkToken, uploadController.deleteThumbnail);

export default router;
