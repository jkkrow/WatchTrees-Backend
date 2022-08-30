import { Router } from 'express';

import * as PaymentController from '../controllers/payment.controller';
import {
  checkAccessToken,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/client-token',
  checkAccessToken,
  checkVerified,
  PaymentController.createClientToken
);

router.post('/subscriptions/webhooks', PaymentController.webhookHandler);

router.post(
  '/subscriptions/:plan',
  checkAccessToken,
  checkVerified,
  PaymentController.createSubscription
);

export default router;
