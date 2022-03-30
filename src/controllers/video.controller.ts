import * as VideoTreeService from '../services/video-tree.service';
import * as UploadService from '../services/upload.service';
import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';

export const createVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const video = await VideoTreeService.create(req.user.id);

  res.json({ video });
});

export const updateVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { uploadTree } = req.body;
  const { id } = req.params;

  await VideoTreeService.update(id, uploadTree, req.user.id);

  res.json({ message: 'Upload progress saved' });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await VideoTreeService.remove(id, req.user.id);

  // TODO: Delete videos & thumbnail from aws s3

  res.json({ message: 'Video deleted successfully' });
});

export const getCreatedVideos = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { page, max } = req.query as { [key: string]: string };

  const { videos, count } = await VideoTreeService.findByCreator(
    req.user.id,
    page,
    max
  );

  res.json({ videos, count });
});

export const getCreatedVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  const video = await VideoTreeService.findOne(id);

  if (video.info.creator.toString() !== req.user.id) {
    throw new HttpError(403, 'Not authorized to this video');
  }

  res.json({ video });
});

export const getClientVideos = asyncHandler(async (req, res) => {
  const params = req.query as {
    page: string;
    max: string;
    search: string;
    channelId: string;
    userId: string;
    ids: string[];
  };

  let result: any;

  if (params.search) {
    result = await VideoTreeService.findClientByKeyword(params);
  } else if (params.channelId) {
    result = await VideoTreeService.findClientByChannel(params);
  } else if (params.ids) {
    result = await VideoTreeService.findClientByIds(params);
  } else {
    result = await VideoTreeService.findClient(params);
  }

  res.json({ videos: result.videos, count: result.count });
});

export const getClientVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query as { [key: string]: string };

  await VideoTreeService.incrementViews(id);
  const video = await VideoTreeService.findClientOne(id, userId);

  res.json({ video });
});

export const getFavorites = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const params = req.query as { page: string; max: string };

  const { videos, count } = await VideoTreeService.findClientByFavorites(
    req.user.id,
    params
  );

  res.json({ videos, count });
});

export const toggleFavorites = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await VideoTreeService.updateFavorites(id, req.user.id);

  res.json({ message: 'Favorites updated' });
});

export const initiateVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, fileType } = req.body;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const uploadData = await UploadService.initiateMutlipart(fileType, key);

  res.json({ uploadId: uploadData.UploadId });
});

export const processVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, partCount } = req.body;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const result = await UploadService.processMultipart(uploadId, partCount, key);

  res.json(result);
});

export const completeVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, parts } = req.body;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const result = await UploadService.completeMultipart(uploadId, parts, key);

  res.json({ url: result.Key });
});

export const cancelVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName } = req.query;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  await UploadService.cancelMultipart(uploadId, key);

  res.json({ message: 'Video upload cancelled' });
});

export const uploadThumbnail = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { isNewFile, fileType, key: imageKey } = req.body;
  let presignedUrl = '';
  let key = '';

  if (isNewFile) {
    const result = await UploadService.uploadImage(fileType, imageKey);

    presignedUrl = result.presignedUrl;
    key = result.key;
  } else {
    await UploadService.deleteImage(key);
  }

  res.json({ presignedUrl, key });
});
