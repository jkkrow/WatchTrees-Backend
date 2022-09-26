import request from 'supertest';
import { Types } from 'mongoose';

import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import app from '../../app';
import * as VideoTreeService from '../../services/video-tree.service';
import * as UserService from '../../services/user.service';
import { UserDocument } from '../../models/user';
import { createToken } from '../../util/jwt';

describe('VideoController', () => {
  let user: UserDocument;
  let accessToken: string;
  const endpoint = '/videos/';

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create('native', 'Test', testEmail, 'password');
    accessToken = createToken(user.id, 'access', '15m');
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('createVideo', () => {
    it('should be failed without authorization token', async () => {
      await request(app).post(endpoint).expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .post(endpoint)
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });

    it('should return a video', async () => {
      await UserService.update(user.id, { isVerified: true });
      const res = await request(app)
        .post(endpoint)
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(201);

      expect(res.body).toHaveProperty('video');
    });
  });

  describe('updateVideo', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .patch(endpoint + ':id')
        .expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .patch(endpoint + ':id')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });

    it('should return a message', async () => {
      await UserService.update(user.id, { isVerified: true });

      const spy = jest
        .spyOn(VideoTreeService, 'update')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .patch(endpoint + ':id')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('deleteVideo', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .delete(endpoint + ':id')
        .expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .delete(endpoint + ':id')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });
  });

  describe('getCreatedVideos', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .get(endpoint + 'created')
        .expect(403);
    });

    it('should return videos and count', async () => {
      const res = await request(app)
        .get(endpoint + 'created')
        .set({ Authorization: 'Bearer ' + accessToken })
        .query({ page: 1, max: 10 })
        .expect(200);

      expect(res.body).toHaveProperty('videos');
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('getCreatedVideo', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .get(endpoint + 'created/:id')
        .expect(403);
    });

    it('should return a video', async () => {
      const spy = jest
        .spyOn(VideoTreeService, 'findOneByCreator')
        .mockReturnValueOnce(Promise.resolve({} as any));

      const res = await request(app)
        .get(endpoint + 'created/:id')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body).toHaveProperty('video');
    });
  });

  describe('getFeaturedVideos', () => {
    it('should return videos and count', async () => {
      const res = await request(app)
        .get(endpoint + 'client/featured')
        .query({ page: 1, max: 10 })
        .expect(200);

      expect(res.body).toHaveProperty('videos');
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('getClientVideos', () => {
    it('should return videos and count', async () => {
      const res = await request(app)
        .get(endpoint + 'client')
        .expect(200);

      expect(res.body).toHaveProperty('videos');
      expect(res.body).toHaveProperty('count');
    });

    it('should return videos by keyword with search params', async () => {
      const spy = jest
        .spyOn(VideoTreeService, 'findClientByKeyword')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .get(endpoint + 'client')
        .query({ search: 'test' })
        .expect(200);

      expect(spy).toBeCalled();
    });

    it('should return videos by channel with channel id params', async () => {
      const spy = jest.spyOn(VideoTreeService, 'findClientByChannel');

      await request(app)
        .get(endpoint + 'client')
        .query({ channelId: user.id })
        .expect(200);

      expect(spy).toBeCalled();
    });

    it('should return videos by ids with ids params', async () => {
      const spy = jest.spyOn(VideoTreeService, 'findClientByIds');

      await request(app)
        .get(endpoint + 'client')
        .query({
          ids: [
            new Types.ObjectId().toString(),
            new Types.ObjectId().toString(),
          ],
        })
        .expect(200);

      expect(spy).toBeCalled();
    });

    it('should return client videos without specific params', async () => {
      const spy = jest.spyOn(VideoTreeService, 'findClient');

      await request(app)
        .get(endpoint + 'client')
        .expect(200);

      expect(spy).toBeCalled();
    });
  });

  describe('getClientVideo', () => {
    it('should increment a views and return a video', async () => {
      const incrementSpy = jest
        .spyOn(VideoTreeService, 'incrementViews')
        .mockImplementationOnce(() => ({} as any));
      const findSpy = jest
        .spyOn(VideoTreeService, 'findClientOne')
        .mockReturnValue(Promise.resolve({} as any));

      const res = await request(app)
        .get(endpoint + 'client/:id')
        .expect(200);

      expect(incrementSpy).toBeCalled();
      expect(findSpy).toBeCalled();
      expect(res.body).toHaveProperty('video');
    });
  });

  describe('getFavorites', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .get(endpoint + 'favorites')
        .expect(403);
    });

    it('should return a videos and count', async () => {
      const res = await request(app)
        .get(endpoint + 'favorites')
        .set({ Authorization: 'Beaer ' + accessToken })
        .expect(200);

      expect(res.body).toHaveProperty('videos');
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('toggleFavorites', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .patch(endpoint + ':id/favorites')
        .expect(403);
    });

    it('should return a message', async () => {
      const spy = jest
        .spyOn(VideoTreeService, 'updateFavorites')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .patch(endpoint + ':id/favorites')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });
});
