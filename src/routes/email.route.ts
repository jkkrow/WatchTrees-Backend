import { Router } from 'express';

import * as EmailController from '../controllers/email.controller';
import { checkBasicAuthentication } from '../middlewares/event.middleware';
import {
  EMAIL_CREDENTIALS_USERNAME,
  EMAIL_CREDENTIALS_PASSWORD,
} from '../config/env';

const router = Router();

router.post(
  '/bounces',
  checkBasicAuthentication(
    EMAIL_CREDENTIALS_USERNAME,
    EMAIL_CREDENTIALS_PASSWORD
  ),
  EmailController.bounceHandler
);

export default router;
