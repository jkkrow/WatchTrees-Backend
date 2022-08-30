import { gateway } from '../config/braintree';
import { asyncHandler } from '../util/async-handler';
import { HttpError } from '../models/error';
import * as UserService from '../services/user.service';

export const createClientToken = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const response = await gateway.clientToken.generate({
    customerId: req.user.id,
  });

  if (response.errors) {
    throw new HttpError(500, response.message);
  }

  res.json({ clientToken: response.clientToken });
});

export const createSubscription = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { nonce } = req.body;
  const { plan } = req.params;

  // Find plan with id
  const { plans: subscriptionPlans } = await gateway.plan.all();

  const subscriptionPlan = subscriptionPlans.find(
    (p) => p.name.toLowerCase() === plan.toLowerCase()
  );

  if (!subscriptionPlan) {
    throw new HttpError(404, 'No Plan found');
  }

  const response = await gateway.subscription.create({
    planId: subscriptionPlan.id,
    paymentMethodNonce: nonce,
  });

  if (response.errors) {
    throw new HttpError(500, response.message);
  }

  res.json({ message: 'Subscription created successfully!' });
});

export const webhookHandler = asyncHandler(async (req, res) => {
  const webhook = await gateway.webhookNotification.parse(
    req.body.bt_signature,
    req.body.bt_payload
  );

  switch (webhook.kind) {
    case 'subscription_charged_successfully': {
      if (!webhook.subscription.transactions) {
        throw new HttpError(404, 'No transactions');
      }

      const userId = webhook.subscription.transactions[0].customer.id;
      const planId = webhook.subscription.planId;

      // Find plan with id
      const { plans: subscriptionPlans } = await gateway.plan.all();
      const subscriptionPlan = subscriptionPlans.find((p) => p.id === planId);

      if (!subscriptionPlan) {
        throw new HttpError(404, 'No Plan found');
      }

      // Update user status
      await UserService.update(userId, { isPremium: true });

      break;
    }

    case 'subscription_expired': {
      // const userId = webhook.subscription.transactions![0].customer.id;

      break;
    }

    default: {
      throw new HttpError(400, 'No action registered for this event');
    }
  }

  res.json({ message: `Handled webhook event: ${webhook.kind}` });
});
