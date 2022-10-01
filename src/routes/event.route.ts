import { Router } from 'express';

import * as EventController from '../controllers/event.controller';
import {
  checkApiKeyAuthentication,
  checkS3ObjectUser,
} from '../middlewares/event.middleware';
import { checKPremium } from '../middlewares/auth.middleware';
import { AWS_EVENTBRIDGE_API_KEY } from '../config/env';

const router = Router();

router.post(
  '/users/create',
  checkApiKeyAuthentication(AWS_EVENTBRIDGE_API_KEY),
  EventController.userCreateEventHandler
);

router.post(
  '/users/delete',
  checkApiKeyAuthentication(AWS_EVENTBRIDGE_API_KEY),
  EventController.userDeleteEventHandler
);

router.post(
  '/video-trees/delete',
  checkApiKeyAuthentication(AWS_EVENTBRIDGE_API_KEY),
  EventController.videoTreeDeleteEventHandler
);

router.post(
  '/videos/upload',
  checkApiKeyAuthentication(AWS_EVENTBRIDGE_API_KEY),
  checkS3ObjectUser,
  checKPremium,
  EventController.videoFileUploadHandler
);

router.post(
  '/videos/convert',
  checkApiKeyAuthentication(AWS_EVENTBRIDGE_API_KEY),
  EventController.videoFileConvertHandler
);

export default router;
