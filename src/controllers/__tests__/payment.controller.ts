import request from 'supertest';

import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import app from '../../app';
import * as PaymentService from '../../services/payment.service';
import * as UserService from '../../services/user.service';
import { UserDocument } from '../../models/user';
import { createToken } from '../../util/jwt';

describe('UploadController', () => {
  let user: UserDocument;
  let accessToken: string;
  const endpoint = '/payment/';

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create('native', 'Test', testEmail, 'password');
    accessToken = createToken(user.id, 'access', '15m');
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('createSubscription', () => {
    it('should be failed if not verified user', async () => {
      await request(app)
        .post(endpoint + 'subscriptions')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });
  });

  describe('captureSubscription', () => {
    it('should be failed if not verified user', async () => {
      await request(app)
        .post(endpoint + 'subscriptions/test/capture')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });
  });

  describe('cancelSubscription', () => {
    it('should be failed if not premium user', async () => {
      await request(app)
        .post(endpoint + 'subscriptions/test/cancel')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });
  });

  describe('subscriptionWebhookHandler', () => {
    it('should be failed with invalid webhook signature', async () => {
      await request(app)
        .post(endpoint + 'subscriptions/webhooks')
        .set({})
        .expect(500);
    });

    it('should update if event type is PAYMENT.SALE.COMPLETED', async () => {
      const verifySpy = jest
        .spyOn(PaymentService, 'verifyWebhookSignature')
        .mockImplementationOnce(() => ({} as any));
      const updateSpy = jest
        .spyOn(PaymentService, 'updateUserPremium')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .post(endpoint + 'subscriptions/webhooks')
        .send({
          event_type: 'PAYMENT.SALE.COMPLETED',
          resource: { billing_agreement_id: 'test', custom: 'test' },
        })
        .expect(200);

      expect(verifySpy).toBeCalled();
      expect(updateSpy).toBeCalled();
    });

    it('should cancel if event type is BILLING.SUBSCRIPTION.CANCELLED', async () => {
      const verifySpy = jest
        .spyOn(PaymentService, 'verifyWebhookSignature')
        .mockImplementationOnce(() => ({} as any));
      const cancelSpy = jest
        .spyOn(PaymentService, 'cancelUserPremium')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .post(endpoint + 'subscriptions/webhooks')
        .send({
          event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
          resource: { id: 'test', custom_id: 'test' },
        })
        .expect(200);

      expect(verifySpy).toBeCalled();
      expect(cancelSpy).toBeCalled();
    });
  });
});
