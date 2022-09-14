import axios from 'axios';

import * as UserService from './user.service';
import { HttpError } from '../models/error';
import { UserPremium } from '../models/user';

const {
  PAYPAL_API_URL,
  PAYPAL_CLIENT_ID,
  PAYPAL_APP_SECRET,
  PAYPAL_WEBHOOK_ID,
} = process.env;
const base = PAYPAL_API_URL;

export const generateAccessToken = async () => {
  const { data } = await axios({
    url: `${base}/v1/oauth2/token`,
    method: 'post',
    data: 'grant_type=client_credentials',
    auth: { username: PAYPAL_CLIENT_ID!, password: PAYPAL_APP_SECRET! },
  });

  return data.access_token;
};

export const listPlans = async () => {
  const accessToken = await generateAccessToken();
  const { data } = await axios({
    url: `${base}/v1/billing/plans`,
    method: 'get',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data.plans;
};

export const findPlanById = async (planId: string) => {
  const accessToken = await generateAccessToken();
  const { data } = await axios({
    url: `${base}/v1/billing/plans/${planId}`,
    method: 'get',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!data) {
    throw new HttpError(404, 'Plan not found');
  }

  return data;
};

export const findPlanByName = async (planName: string) => {
  const plans = await listPlans();
  const selectedPlan = plans.find(
    (plan: any) => plan.name.toLowerCase() === planName.toLowerCase()
  );

  return selectedPlan;
};

export const findSubscriptionById = async (subscriptionId: string) => {
  const accessToken = await generateAccessToken();
  const { data } = await axios({
    url: `${base}/v1/billing/subscriptions/${subscriptionId}`,
    method: 'get',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!data) {
    throw new HttpError(404, 'Subscription not found');
  }

  return data;
};

export const createSubscription = async (planId: string, userId: string) => {
  const accessToken = await generateAccessToken();
  const { data } = await axios({
    url: `${base}/v1/billing/subscriptions`,
    method: 'post',
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      plan_id: planId,
      custom_id: userId,
    },
  });

  return data;
};

export const captureSubscription = async (
  subscriptionId: string,
  userId: string
) => {
  const subscription = await findSubscriptionById(subscriptionId);

  const payedAt = subscription.billing_info.last_payment.time;
  const isPayedNow = new Date(new Date(payedAt).getTime() + 60000) > new Date();
  const isActive = subscription.status === 'ACTIVE';
  const isUserMatched = userId === subscription.custom_id;

  if (!isPayedNow || !isActive || !isUserMatched) {
    throw new HttpError(400, 'Invalid request');
  }

  const user = await updateUserPremium(subscriptionId, userId);

  return user.premium as UserPremium;
};

export const cancelSubscription = async (
  subscriptionId: string,
  reason?: string
) => {
  const accessToken = await generateAccessToken();
  const { data } = await axios({
    url: `${base}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    method: 'post',
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { reason: reason || 'No reason' },
  });

  return data;
};

export const verifyWebhookSignature = async (body: any, headers: any) => {
  const accessToken = await generateAccessToken();
  const { data } = await axios({
    url: `${base}/v1/notifications/verify-webhook-signature`,
    method: 'post',
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      webhook_event: body,
      webhook_id: PAYPAL_WEBHOOK_ID,
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
    },
  });

  if (data.verification_status !== 'SUCCESS') {
    throw new HttpError(400, 'Webhook Notification not verified');
  }

  return data;
};

export const updateUserPremium = async (
  subscriptionId: string,
  userId: string
) => {
  const subscription = await findSubscriptionById(subscriptionId);
  const plan = await findPlanById(subscription.plan_id);

  const nextBillingTime = new Date(subscription.billing_info.next_billing_time);
  const expiredAt = new Date(nextBillingTime.setUTCHours(23, 59, 59, 999));

  return await UserService.update(userId, {
    premium: {
      id: subscriptionId,
      name: plan.name,
      expiredAt,
      isCancelled: false,
    },
  });
};

export const cancelUserPremium = async (
  subscriptionId: string,
  userId: string
) => {
  const user = await UserService.findById(userId);

  if (!user.premium) {
    throw new HttpError(403);
  }

  if (user.premium.isCancelled) {
    throw new HttpError(400, 'Already cancelled premium account');
  }

  if (user.premium.id !== subscriptionId) {
    return;
  }

  return await UserService.update(userId, {
    premium: {
      id: user.premium.id,
      name: user.premium.name,
      expiredAt: user.premium.expiredAt,
      isCancelled: true,
    },
  });
};
