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

router.post(
  '/subscription/:plan',
  checkAccessToken,
  checkVerified,
  PaymentController.createSubscription
);

// router.post('/webhook', PaymentController.webhookEventHandler);

export default router;
