import request from 'supertest';
import { HydratedDocument, Types } from 'mongoose';

import { connectDB, clearDB, closeDB } from '../../test/db';
import app from '../../app';
import * as VideoTreeService from '../../services/video-tree.service';
import * as UploadService from '../../services/upload.service';
import * as UserService from '../../services/user.service';
import { User } from '../../models/user';
import { createAccessToken } from '../../util/jwt-token';

describe('VideoController', () => {
  let user: HydratedDocument<User>;
  let accessToken: string;
  const endpoint = '/api/videos/';

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create(
      'native',
      'Test',
      'test@example.com',
      'password'
    );
    accessToken = createAccessToken(user.id);
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

    it('should return a message', async () => {
      await UserService.update(user.id, { isVerified: true });

      const spy = jest
        .spyOn(VideoTreeService, 'remove')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .delete(endpoint + ':id')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
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

  describe('initiateVideoUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .post(endpoint + 'upload/multipart')
        .expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .post(endpoint + 'upload/multipart')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });

    it('should have videoId, fileName, and fileType in request body', async () => {
      await UserService.update(user.id, { isVerified: true });
      await request(app)
        .post(endpoint + 'upload/multipart')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(500);
    });

    it('should return upload id', async () => {
      await UserService.update(user.id, { isVerified: true });
      const spy = jest
        .spyOn(UploadService, 'initiateMultipart')
        .mockReturnValueOnce(Promise.resolve({ UploadId: 'test' }) as any);

      const res = await request(app)
        .post(endpoint + 'upload/multipart')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ videoId: 'testId', fileName: 'test', fileType: 'video/mp4' })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.uploadId).toBeTruthy();
    });
  });

  describe('processVideoUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .put(endpoint + 'upload/multipart/:uploadId')
        .expect(403);
    });

    it('should return presigned urls', async () => {
      const spy = jest
        .spyOn(UploadService, 'processMultipart')
        .mockReturnValueOnce(Promise.resolve(['asdfasdf']));

      const res = await request(app)
        .put(endpoint + 'upload/multipart/:uploadId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ videoId: 'testId', fileName: 'test', partCount: 1 })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.presignedUrls).toBeTruthy();
    });
  });

  describe('completeVideoUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .post(endpoint + 'upload/multipart/:uploadId')
        .expect(403);
    });

    it('should return a video url', async () => {
      const spy = jest
        .spyOn(UploadService, 'completeMultipart')
        .mockReturnValueOnce(Promise.resolve({ Key: 'test.mp4' } as any));

      const res = await request(app)
        .post(endpoint + 'upload/multipart/:uploadId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.url).toBeTruthy();
    });
  });

  describe('cancelVideoUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .delete(endpoint + 'upload/multipart/:uploadId')
        .expect(403);
    });

    it('should return a message', async () => {
      const spy = jest
        .spyOn(UploadService, 'cancelMultipart')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .delete(endpoint + 'upload/multipart/:uploadId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('uploadThumbnail', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .patch(endpoint + 'upload/thumbnail')
        .expect(403);
    });

    it('should upload image if there is new file', async () => {
      const spy = jest.spyOn(UploadService, 'uploadImage');

      const res = await request(app)
        .patch(endpoint + 'upload/thumbnail')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ isNewFile: true, fileType: 'image/png', key: 'test.png' })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body).toHaveProperty('presignedUrl');
      expect(res.body).toHaveProperty('key');
    });

    it('should delete image if there is no file', async () => {
      const spy = jest
        .spyOn(UploadService, 'deleteImage')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .patch(endpoint + 'upload/thumbnail')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ isNewFile: false, fileType: 'image/png', key: 'test.png' })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body).toHaveProperty('presignedUrl');
      expect(res.body).toHaveProperty('key');
    });
  });
});
