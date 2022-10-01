import request from 'supertest';

import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import app from '../../app';
import * as AuthService from '../../services/auth.service';
import * as UserService from '../../services/user.service';
import * as EmailService from '../../services/email.service';
import * as VideoTreeService from '../../services/video-tree.service';
import * as VideoNodeService from '../../services/video-node.service';
import * as UploadService from '../../services/upload.service';
import * as ConvertService from '../../services/convert.service';
import * as HistoryService from '../../services/history.service';
import * as PaymentService from '../../services/payment.service';
import { APPLICATION_NAME, AWS_EVENTBRIDGE_API_KEY } from '../../config/env';
import { UserDocument } from '../../models/user';

jest.mock('../../services/auth.service.ts');
jest.mock('../../services/email.service.ts');
jest.mock('../../services/video-tree.service.ts');
jest.mock('../../services/video-node.service.ts');
jest.mock('../../services/upload.service.ts');
jest.mock('../../services/convert.service.ts');
jest.mock('../../services/history.service.ts');
jest.mock('../../services/payment.service.ts');

describe('EventController', () => {
  let user: UserDocument;
  const endpoint = '/events/';

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create('native', 'Test', testEmail, 'password');
  });
  afterEach(clearDB);
  afterAll(closeDB);

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

  describe('videoFileUploadHandler', () => {
    it('should be failed without api key', async () => {
      await request(app)
        .post(endpoint + 'videos/upload')
        .expect(401);
    });

    it('should be failed if user is not premium account', async () => {
      await request(app)
        .post(endpoint + 'videos/upload')
        .send({
          detail: { object: { key: `videos/${user.id}/test/video.mp4` } },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(403);
    });

    it('should run a convert job', async () => {
      await UserService.update(user.id, { isAdmin: true });
      const spy = jest.spyOn(ConvertService, 'createJob');
      jest.spyOn(ConvertService, 'createMetadata').mockReturnValueOnce({
        inputPath: 'test',
        outputPath: 'test',
        jobMetadata: {
          application: APPLICATION_NAME,
          fileName: 'test',
          key: 'test',
          treeId: 'test',
        },
      });

      await request(app)
        .post(endpoint + 'videos/upload')
        .send({
          detail: {
            object: { key: `videos/${user.id}/test/video.mp4` },
            bucket: { name: 'test' },
          },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });

  describe('videoFileConvertHandler', () => {
    it('should be failed without api key', async () => {
      await request(app)
        .post(endpoint + 'videos/convert')
        .expect(401);
    });

    it('should update video nodes', async () => {
      const spy = jest.spyOn(VideoNodeService, 'updateNodes');
      jest.spyOn(VideoTreeService, 'findOne').mockReturnValueOnce(
        Promise.resolve({
          root: { _id: 'test', info: { name: 'test' }, children: [] },
        } as any)
      );

      await request(app)
        .post(endpoint + 'videos/convert')
        .send({
          detail: {
            userMetadata: {
              key: 'test',
              fileName: 'test',
              treeId: 'test',
              application: APPLICATION_NAME,
            },
          },
        })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });
});
