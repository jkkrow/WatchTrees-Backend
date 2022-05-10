import * as UploadService from '../upload.service';

describe('UploadService', () => {
  describe('initiateMultipart', () => {
    it('should create return an upload id', async () => {
      const result = await UploadService.initiateMultipart(
        'video/mp4',
        'test.mp4'
      );

      expect(result).toHaveProperty('UploadId');
    });

    it('should be failed if file type is other than video', async () => {
      await expect(
        UploadService.initiateMultipart('image/png', 'test.png')
      ).rejects.toThrow();
    });
  });

  describe('processMultipart', () => {
    it('should return a presigned url for every parts', async () => {
      const result = await UploadService.initiateMultipart(
        'video/mp4',
        'test.mp4'
      );

      const presignedUrls = await UploadService.processMultipart(
        result.UploadId!,
        2,
        'test.mp4'
      );

      expect(presignedUrls).toHaveLength(2);
    });
  });

  describe('completeMultipart', () => {
    it('should return a complete result only if all parts uploaded successfully', async () => {
      const initiateResult = await UploadService.initiateMultipart(
        'video/mp4',
        'test.mp4'
      );
      await expect(
        UploadService.completeMultipart(
          initiateResult.UploadId!,
          [{ ETag: 'asdfasdf', PartNumber: 1 }],
          'test.mp4'
        )
      ).rejects.toThrow();
    });
  });

  describe('cancelMultipart', () => {
    it('should cancel a multipart upload', async () => {
      const result = await UploadService.initiateMultipart(
        'video/mp4',
        'test.mp4'
      );

      const cancelResult = await UploadService.cancelMultipart(
        result.UploadId!,
        'test.mp4'
      );

      expect(cancelResult).toBeDefined();
    });
  });

  describe('uploadImage', () => {
    it('should return a presigned url', async () => {
      const result = await UploadService.uploadImage('image/png');
      expect(result).toHaveProperty('presignedUrl');
    });

    it('should be failed if file type is other than image', async () => {
      await expect(UploadService.uploadImage('video/mp4')).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should return empty object if nothing changed', async () => {
      const result = await UploadService.deleteImage('test.png');
      expect(result).toStrictEqual({});
    });
  });
});
