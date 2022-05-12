import { parse } from 'path';
import { v4 as uuidv4 } from 'uuid';

import * as UploadService from '../services/upload.service';
import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';

export const initiateMultipartUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, fileType } = req.body;
  const { dir } = parse(fileType);

  if (dir !== 'video') {
    throw new HttpError(422, 'Invalid file type');
  }

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
  const { dir, name } = parse(fileType);

  if (key && (key as string).split('/')[1] !== req.user.id) {
    throw new HttpError(403);
  }

  if (dir !== 'image') {
    throw new HttpError(422, 'Invalid file type');
  }

  const newKey = `images/${req.user.id}/${uuidv4()}.${name}`;
  const result = await UploadService.uploadObject(fileType, newKey);
  if (key) await UploadService.deleteObject(key);

  res.json({ presignedUrl: result.presignedUrl, key: result.key });
});

export const deleteImage = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { key } = req.query as { key: string };

  if (key && key.split('/')[1] !== req.user.id) {
    throw new HttpError(403);
  }

  await UploadService.deleteObject(key);

  res.json({ message: 'Deleted image successfully' });
});
