import { gateway } from '../config/braintree';
import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';

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

  const { plans: subscriptionPlans } = await gateway.plan.all();

  const subscriptionPlan = subscriptionPlans.find(
    (p) => p.name.toLowerCase() === plan.toLowerCase()
  );

  if (!subscriptionPlan) {
    throw new Error('No Plan found');
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

// export const webhookEventHandler = asyncHandler(async (req, res) => {
//   const webhookEvent = req.body;

//   console.log(webhookEvent);
// });
