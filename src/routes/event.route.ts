import { Router } from 'express';

import * as EventController from '../controllers/event.controller';
import { checkApiKeyAuthentication } from '../middlewares/event.middleware';
import { AWS_EVENTBRIDGE_API_KEY } from '../config/env';

const router = Router();

router.post(
  '/users/create',
  checkApiKeyAuthentication(AWS_EVENTBRIDGE_API_KEY),
  EventController.userCreateEventHandler
);

export default router;
