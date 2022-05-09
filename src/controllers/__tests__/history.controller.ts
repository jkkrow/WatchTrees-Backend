import request from 'supertest';

import { connectDB, closeDB } from '../../test/db';
import app from '../../app';
import * as UserService from '../../services/user.service';
import * as HistoryService from '../../services/history.service';
import { createAccessToken } from '../../util/jwt-token';

describe('UserController', () => {
  let accessToken: string;
  const endpoint = '/api/histories/';

  beforeAll(async () => {
    await connectDB();
    const user = await UserService.create(
      'native',
      'Test',
      'test@example.com',
      'password'
    );
    accessToken = createAccessToken(user.id);
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
