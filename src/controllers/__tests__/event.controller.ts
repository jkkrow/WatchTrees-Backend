import request from 'supertest';

import { testEmail } from '../../test/variables';
import app from '../../app';
import * as AuthService from '../../services/auth.service';
import { AWS_EVENTBRIDGE_API_KEY } from '../../config/env';

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
      const spy = jest
        .spyOn(AuthService, 'sendVerification')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .post(endpoint + 'users/create')
        .send({ detail: { fullDocument: { email: testEmail } } })
        .set({ secret: AWS_EVENTBRIDGE_API_KEY })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });
});
