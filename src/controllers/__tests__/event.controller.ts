import request from 'supertest';

import { testEmail } from '../../test/variables';
import app from '../../app';
import * as AuthService from '../../services/auth.service';
import * as EmailService from '../../services/email.service';
import * as VideoTreeService from '../../services/video-tree.service';
import * as UploadService from '../../services/upload.service';
import * as HistoryService from '../../services/history.service';
import * as PaymentService from '../../services/payment.service';
import { AWS_EVENTBRIDGE_API_KEY } from '../../config/env';

jest.mock('../../services/auth.service.ts');
jest.mock('../../services/email.service.ts');
jest.mock('../../services/video-tree.service.ts');
jest.mock('../../services/upload.service.ts');
jest.mock('../../services/history.service.ts');
jest.mock('../../services/payment.service.ts');

describe('EventController', () => {
  const endpoint = '/api/events/';

  describe('userCreateEventHandler', () => {
    it('should be failed without api key', async () => {
      await request(app)
        .post(endpoint + 'users/create')
        .send({ detail: { fullDocument: { email: testEmail } } })
        .expect(401);
    });

    it('should send verification email', async () => {
      const spy = jest.spyOn(AuthService, 'sendVerification');

      await request(app)
        .post(endpoint + 'users/create')
        .send({ detail: { fullDocument: { email: testEmail } } })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });

  describe('userDeleteEventHandler', () => {
    it('should be failed without api key', async () => {
      await request(app)
        .post(endpoint + 'users/delete')
        .send({
          detail: {
            fullDocumentBeforeChange: { _id: 'test', email: testEmail },
          },
        })
        .expect(401);
    });

    it('should delete user created contents', async () => {
      const videoSpy = jest.spyOn(VideoTreeService, 'deleteByCreator');
      const historySpy = jest.spyOn(HistoryService, 'deleteByUser');
      const uploadSpy = jest.spyOn(UploadService, 'deleteDirectory');

      await request(app)
        .post(endpoint + 'users/delete')
        .send({
          detail: {
            fullDocumentBeforeChange: { _id: 'test', email: testEmail },
          },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(videoSpy).toBeCalled();
      expect(historySpy).toBeCalled();
      expect(uploadSpy).toBeCalled();
    });

    it('should cancel recurring payment if user has premium membership', async () => {
      const paymentSpy = jest.spyOn(PaymentService, 'cancelSubscription');

      await request(app)
        .post(endpoint + 'users/delete')
        .send({
          detail: {
            fullDocumentBeforeChange: {
              _id: 'test',
              email: testEmail,
              premium: {
                id: 'testId',
                name: 'Standard',
                expiredAt: new Date(),
                isCancelled: false,
              },
            },
          },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(paymentSpy).toBeCalled();
    });

    it('should send an email to user', async () => {
      const emailSpy = jest.spyOn(EmailService, 'sendEmailWithTemplate');

      await request(app)
        .post(endpoint + 'users/delete')
        .send({
          detail: {
            fullDocumentBeforeChange: { _id: 'test', email: testEmail },
          },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(emailSpy).toBeCalled();
    });
  });

  describe('videoTreeDeleteEventHandler', () => {
    it('should be failed without api key', async () => {
      await request(app)
        .post(endpoint + 'video-trees/delete')
        .send({
          detail: {
            fullDocumentBeforeChange: {
              _id: 'test',
              info: { creator: 'test' },
            },
          },
        })
        .expect(401);
    });

    it('should delete related contents', async () => {
      const uploadSpy = jest.spyOn(UploadService, 'deleteDirectory');
      const historySpy = jest.spyOn(HistoryService, 'deleteByVideoTree');

      await request(app)
        .post(endpoint + 'video-trees/delete')
        .send({
          detail: {
            fullDocumentBeforeChange: {
              _id: 'test',
              info: { creator: 'test' },
            },
          },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(uploadSpy).toBeCalled();
      expect(historySpy).toBeCalled();
    });
  });
});
