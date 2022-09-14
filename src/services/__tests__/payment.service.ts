import { HydratedDocument } from 'mongoose';

import { connectDB, clearDB, closeDB } from '../../test/db';
import * as PaymentService from '../payment.service';
import * as AuthService from '../auth.service';
import { User } from '../../models/user';

describe('UserService', () => {
  let user: HydratedDocument<User>;

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await AuthService.signup('Test', 'test@example.com', 'password');
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('generateAccessToken', () => {
    it('should return access token', async () => {
      const accessToken = await PaymentService.generateAccessToken();

      expect(accessToken).not.toBeUndefined();
    });
  });

  describe('listPlans', () => {
    it('should return array of plans', async () => {
      const plans = await PaymentService.listPlans();

      expect(plans.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findPlanById', () => {
    it('should be failed if no plan found', async () => {
      await expect(PaymentService.findPlanById('test')).rejects.toThrow();
    });
  });

  describe('findPlanByName', () => {
    it('should return a plan', async () => {
      const plan = await PaymentService.findPlanByName('Standard');

      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('product_id');
    });
  });

  describe('findSubscriptionById', () => {
    it('should be failed if no subscription found', async () => {
      await expect(
        PaymentService.findSubscriptionById('test')
      ).rejects.toThrow();
    });
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const plan = await PaymentService.findPlanByName('Standard');
      const subscription = await PaymentService.createSubscription(
        plan.id,
        user.id
      );

      expect(subscription).toHaveProperty('id');
      expect(subscription.status).toEqual('APPROVAL_PENDING');
    });
  });

  describe('captureSubscription', () => {
    it('should be failed if the subscription is not active', async () => {
      const plan = await PaymentService.findPlanByName('Standard');
      const subscription = await PaymentService.createSubscription(
        plan.id,
        user.id
      );

      await expect(
        PaymentService.captureSubscription(subscription.id, user.id)
      ).rejects.toThrow();
    });
  });

  describe('cancelSubscription', () => {
    it('should be failed if no subscription found', async () => {
      await expect(
        PaymentService.cancelSubscription('test', user.id)
      ).rejects.toThrow();
    });
  });

  describe('verifySubscription', () => {
    it('should be failed if no subscription found', async () => {
      await expect(
        PaymentService.verifySubscription('test', 'user.id')
      ).rejects.toThrow();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should be failed with invalid signature', async () => {
      await expect(
        PaymentService.verifyWebhookSignature({}, {})
      ).rejects.toThrow();
    });
  });
});
