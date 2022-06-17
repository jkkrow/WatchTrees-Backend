import request from 'supertest';
import { HydratedDocument } from 'mongoose';

import { connectDB, clearDB, closeDB } from '../../test/db';
import app from '../../app';
import * as UploadService from '../../services/upload.service';
import * as UserService from '../../services/user.service';
import { User } from '../../models/user';
import { createAccessToken } from '../../util/jwt';

describe('UploadController', () => {
  let user: HydratedDocument<User>;
  let accessToken: string;
  const endpoint = '/api/upload/';

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

  describe('initiateMultipartUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .post(endpoint + 'multipart')
        .expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .post(endpoint + 'multipart')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });

    it('should be failed if file type is other than video', async () => {
      await UserService.update(user.id, { isVerified: true });
      await request(app)
        .post(endpoint + 'multipart')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({
          videoId: 'test-id',
          fileName: 'test.png',
          fileType: 'image/png',
        })
        .expect(422);
    });

    it('should return upload id', async () => {
      await UserService.update(user.id, { isVerified: true });
      const spy = jest
        .spyOn(UploadService, 'initiateMultipart')
        .mockReturnValueOnce(Promise.resolve({ UploadId: 'test' }) as any);

      const res = await request(app)
        .post(endpoint + 'multipart')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ videoId: 'testId', fileName: 'test', fileType: 'video/mp4' })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.uploadId).toBeTruthy();
    });
  });

  describe('processMultipartUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .put(endpoint + 'multipart/:uploadId')
        .expect(403);
    });

    it('should return presigned urls', async () => {
      const spy = jest
        .spyOn(UploadService, 'processMultipart')
        .mockReturnValueOnce(Promise.resolve(['asdfasdf']));

      const res = await request(app)
        .put(endpoint + 'multipart/:uploadId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ videoId: 'testId', fileName: 'test', partCount: 1 })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.presignedUrls).toBeTruthy();
    });
  });

  describe('completeMultipartUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .post(endpoint + 'multipart/:uploadId')
        .expect(403);
    });

    it('should return a video url', async () => {
      const spy = jest
        .spyOn(UploadService, 'completeMultipart')
        .mockReturnValueOnce(Promise.resolve({ Key: 'test.mp4' } as any));

      const res = await request(app)
        .post(endpoint + 'multipart/:uploadId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.url).toBeTruthy();
    });
  });

  describe('cancelMultipartUpload', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .delete(endpoint + 'multipart/:uploadId')
        .expect(403);
    });

    it('should return a message', async () => {
      const spy = jest
        .spyOn(UploadService, 'cancelMultipart')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .delete(endpoint + 'multipart/:uploadId')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('uploadImage', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .put(endpoint + 'image')
        .expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .put(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });

    it('should be failed if prefix is not equal to user id', async () => {
      await UserService.update(user.id, { isVerified: true });

      await request(app)
        .put(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ fileType: 'image/png', key: 'images/test-id/test.png' })
        .expect(403);
    });

    it('should be failed if file type is other than image', async () => {
      await UserService.update(user.id, { isVerified: true });

      await request(app)
        .put(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ fileType: 'video/mp4', key: `images/${user.id}/test.mp4` })
        .expect(422);
    });

    it('should delete image if there already is', async () => {
      await UserService.update(user.id, { isVerified: true });
      const spy = jest.spyOn(UploadService, 'deleteObject');

      await request(app)
        .put(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ fileType: 'image/png', key: `images/${user.id}/test.png` })
        .expect(200);

      expect(spy).toBeCalled();
    });

    it('should return a presigned url and key for new image', async () => {
      await UserService.update(user.id, { isVerified: true });
      const spy = jest.spyOn(UploadService, 'uploadObject');

      const res = await request(app)
        .put(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ fileType: 'image/png', key: '' })
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body).toHaveProperty('presignedUrl');
      expect(res.body).toHaveProperty('key');
    });
  });

  describe('deleteImage', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .delete(endpoint + 'image')
        .expect(403);
    });

    it('should be failed if not verified user', async () => {
      await request(app)
        .delete(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .query({ key: 'test.png' })
        .expect(403);
    });

    it('should be failed if prefix is not equal to user id', async () => {
      await UserService.update(user.id, { isVerified: true });

      await request(app)
        .delete(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .query({ key: 'images/test-id/test.png' })
        .expect(403);
    });

    it('should delete image', async () => {
      await UserService.update(user.id, { isVerified: true });
      const spy = jest.spyOn(UploadService, 'deleteObject');

      await request(app)
        .delete(endpoint + 'image')
        .set({ Authorization: 'Bearer ' + accessToken })
        .query({ key: `images/${user.id}/test.png` })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });
});
