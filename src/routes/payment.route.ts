import { Router } from 'express';

import * as PaymentController from '../controllers/payment.controller';
import {
  checkAccessToken,
  checKPremium,
  checkVerified,
} from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/subscriptions',
  checkAccessToken,
  checkVerified,
  PaymentController.createSubscription
);

router.post(
  '/subscriptions/:id/cancel',
  checkAccessToken,
  checKPremium,
  PaymentController.cancelSubscription
);

router.post(
  '/subscriptions/webhooks',
  PaymentController.subscriptionWebhookHandler
);

export default router;
