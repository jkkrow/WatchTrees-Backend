import { asyncHandler } from '../util/async-handler';
import { HttpError } from '../models/error';
import * as UserService from '../services/user.service';
import * as PaymentService from '../services/payment.service';

export const createClientToken = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const clientToken = await PaymentService.generateClientToken(req.user.id);

  res.json({ clientToken });
});

export const createSubscription = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { nonce } = req.body;
  const { plan: planName } = req.params;

  const plan = await PaymentService.findPlanByName(planName);
  await PaymentService.createSubscription(plan.id, nonce);

  res.json({ message: 'Subscription created successfully!' });
});

export const webhookHandler = asyncHandler(async (req, res) => {
  const webhook = await PaymentService.parseWebhookNotification(
    req.body.bt_signature,
    req.body.bt_payload
  );

  switch (webhook.kind) {
    case 'subscription_charged_successfully': {
      const { userId, planId } = PaymentService.getSubscriptionData(
        webhook.subscription
      );

      await PaymentService.findPlanById(planId);
      await UserService.update(userId, { isPremium: true });

      break;
    }

    case 'subscription_expired': {
      const { userId, planId } = PaymentService.getSubscriptionData(
        webhook.subscription
      );

      await PaymentService.findPlanById(planId);
      await UserService.update(userId, { isPremium: false });

      break;
    }

    default: {
      throw new HttpError(400, 'No action registered for this event');
    }
  }

  res.json({ message: `Handled webhook event: ${webhook.kind}` });
});
