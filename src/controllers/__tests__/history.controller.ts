import request from 'supertest';

import { connectDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import app from '../../app';
import * as UserService from '../../services/user.service';
import * as HistoryService from '../../services/history.service';
import { UserDocument } from '../../models/user';
import { createToken } from '../../util/jwt';

describe('UserController', () => {
  let user: UserDocument;
  let accessToken: string;
  const endpoint = '/histories/';

  beforeAll(async () => {
    await connectDB();
    user = await UserService.create('native', 'Test', testEmail, 'password');
    accessToken = createToken(user.id, 'access', '15m');
  });
  afterAll(closeDB);

  describe('getHistory', () => {
    it('should return a json with videos and count', async () => {
      const res = await request(app)
        .get(endpoint)
        .set({ Authorization: 'Bearer ' + accessToken })
        .query({ page: 1, max: 10, skipFullyWatched: false })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('videos');
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('putHistory', () => {
    it('should have history in request body', async () => {
      await request(app)
        .put(endpoint)
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(500);
    });

    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(HistoryService, 'put')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .put(endpoint)
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ history: {} })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('removeHistory', () => {
    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(HistoryService, 'remove')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .delete(endpoint + ':videoId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });
});
