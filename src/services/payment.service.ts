import braintree from 'braintree';
import { gateway } from '../config/braintree';
import { HttpError } from '../models/error';

export const generateClientToken = async (userId: string) => {
  const response = await gateway.clientToken.generate({
    customerId: userId,
  });

  if (response.errors) {
    throw new HttpError(500, response.message);
  }

  return response.clientToken;
};

export const findPlanById = async (planId: string) => {
  const { plans } = await gateway.plan.all();
  const plan = plans.find((p) => p.id === planId);

  if (!plan) {
    throw new HttpError(404, 'No Plan found');
  }

  return plan;
};

export const findPlanByName = async (planName: string) => {
  const { plans } = await gateway.plan.all();
  const plan = plans.find(
    (p) => p.name.toLowerCase() === planName.toLowerCase()
  );

  if (!plan) {
    throw new HttpError(404, 'No Plan found');
  }

  return plan;
};

export const createSubscription = async (planId: string, nonce: string) => {
  const response = await gateway.subscription.create({
    planId,
    paymentMethodNonce: nonce,
  });

  if (response.errors) {
    throw new HttpError(500, response.message);
  }

  return response.subscription;
};

export const parseWebhookNotification = async (
  bt_signature: string,
  bt_payload: string
) => {
  const webhook = await gateway.webhookNotification.parse(
    bt_signature,
    bt_payload
  );

  return webhook;
};

export const getSubscriptionData = (subscription: braintree.Subscription) => {
  if (!subscription.transactions) {
    throw new HttpError(404, 'No transactions');
  }

  const userId = subscription.transactions[0].customer.id;
  const planId = subscription.planId;

  return { userId, planId };
};
