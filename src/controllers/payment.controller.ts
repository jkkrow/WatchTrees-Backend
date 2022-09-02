import * as UserService from '../services/user.service';
import * as PaymentService from '../services/payment.service';
import { asyncHandler } from '../util/async-handler';

export const createSubscription = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { planName } = req.body;

  const plan = await PaymentService.findPlanByName(planName);
  const subscription = await PaymentService.createSubscription(
    plan.id,
    req.user.id
  );

  res.json({ subscription });
});

export const webhookHandler = asyncHandler(async (req, res) => {
  await PaymentService.verifyWebhookSignature(req.body, req.headers);

  const subscriptionId = req.body['billing_agreement_id'];
  const userId = req.body.custom;

  if (req.body.event_type === 'PAYMENT.SALE.COMPLETED') {
    await PaymentService.findSubscriptionById(subscriptionId);
    await UserService.update(userId, { isVerified: true });
  }

  if (req.body.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    // Add handler for subscription cancelled
  }

  res.json({ message: 'Triggered webhook successfully' });
});
