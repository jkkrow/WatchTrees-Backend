import { Router } from 'express';

import * as PaymentController from '../controllers/payment.controller';
import {
  checkAccessToken,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/subscriptions',
  checkAccessToken,
  checkVerified,
  PaymentController.createSubscription
);

router.post('/webhooks', PaymentController.webhookHandler);

export default router;
