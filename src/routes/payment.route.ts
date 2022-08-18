import { Router } from 'express';

import * as PaymentController from '../controllers/payment.controller';

const router = Router();

router.post('/webhook', PaymentController.webhookEventHandler);

export default router;
