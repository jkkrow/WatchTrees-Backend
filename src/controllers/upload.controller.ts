import * as UploadService from '../services/upload.service';
import { asyncHandler } from '../util/async-handler';

export const initiateMultipartUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, fileType } = req.body;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const uploadData = await UploadService.initiateMultipart(fileType, key);

  res.json({ uploadId: uploadData.UploadId });
});

export const processMultipartUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, partCount } = req.body;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const presignedUrls = await UploadService.processMultipart(
    uploadId,
    partCount,
    key
  );

  res.json({ presignedUrls });
});

export const completeMultipartUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, parts } = req.body;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const result = await UploadService.completeMultipart(uploadId, parts, key);

  res.json({ url: result.Key });
});

export const cancelMultipartUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName } = req.query;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  await UploadService.cancelMultipart(uploadId, key);

  res.json({ message: 'Video upload cancelled' });
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { fileType, key } = req.body;

  key && (await UploadService.deleteImage(key));
  const result = await UploadService.uploadImage(fileType);

  res.json({ presignedUrl: result.presignedUrl, key: result.key });
});

export const deleteImage = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { key } = req.query;

  await UploadService.deleteImage(key as string);

  res.json({ message: 'Deleted image successfully' });
});
