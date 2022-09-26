import request from 'supertest';

import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import app from '../../app';
import * as EmailService from '../../services/email.service';
import {
  EMAIL_CREDENTIALS_USERNAME,
  EMAIL_CREDENTIALS_PASSWORD,
} from '../../config/env';

describe('EmailController', () => {
  const endpoint = '/email/';

  beforeAll(connectDB);
  afterEach(clearDB);
  afterAll(closeDB);

  describe('bounceHandler', () => {
    it('should be failed without username and password', async () => {
      await request(app)
        .post(endpoint + 'bounces')
        .send({
          Email: testEmail,
          Type: 'HardBounce',
          MessageStream: 'outbound',
          BouncedAt: new Date(),
        })
        .expect(401);
    });

    it('should create bounce in DB', async () => {
      const hash = Buffer.from(
        `${EMAIL_CREDENTIALS_USERNAME}:${EMAIL_CREDENTIALS_PASSWORD}`,
        'utf-8'
      ).toString('base64');

      const spy = jest
        .spyOn(EmailService, 'createBounce')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .post(endpoint + 'bounces')
        .send({
          Email: testEmail,
          Type: 'HardBounce',
          MessageStream: 'outbound',
          BouncedAt: new Date(),
        })
        .set({
          authorization: `Basic ${hash}`,
        })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });
});
