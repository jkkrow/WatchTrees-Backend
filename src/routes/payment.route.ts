import { Router } from 'express';

import * as PaymentController from '../controllers/payment.controller';

const router = Router();

router.post('/checkout', PaymentController.createCheckoutSession);
router.post('/portal', PaymentController.createPortalSession);

export default router;
