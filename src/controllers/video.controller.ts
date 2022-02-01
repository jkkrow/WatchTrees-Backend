import { RequestHandler } from 'express';

import * as VideoService from '../services/video.service';
import * as UploadService from '../services/upload.service';
import { HttpError } from '../models/error';

export const createVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const video = await VideoService.create(req.user.id);

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const updateVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { uploadTree } = req.body;
    const { id } = req.params;

    await VideoService.update(id, uploadTree);

    res.json({ message: 'Upload progress saved' });
  } catch (err) {
    return next(err);
  }
};

export const deleteVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { id } = req.params;

    await VideoService.remove(id, req.user.id);

    // TODO: Delete videos & thumbnail from aws s3

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    return next(err);
  }
};

export const getCreatedVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { page, max } = req.query as { [key: string]: string };

    const { videos, count } = await VideoService.findByCreator(
      req.user.id,
      page,
      max
    );

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const getCreatedVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { id } = req.params;

    const video = await VideoService.findOne(id);

    if (video.info.creator.toString() !== req.user.id) {
      throw new HttpError(403, 'Not authorized to this video');
    }

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const getClientVideos: RequestHandler = async (req, res, next) => {
  try {
    const params = req.query as {
      page: string;
      max: string;
      search: string;
      channelId: string;
      currentUserId: string;
      ids: string[];
    };

    let result: any;

    if (params.search) {
      result = await VideoService.findClientByKeyword(params);
    } else if (params.channelId) {
      result = await VideoService.findClientByChannel(params);
    } else if (params.ids) {
      result = await VideoService.findClientByIds(params);
    } else {
      result = await VideoService.findClient(params);
    }

    res.json({ videos: result.videos, count: result.count });
  } catch (err) {
    return next(err);
  }
};

export const getClientVideo: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query as { [key: string]: string };

    await VideoService.incrementViews(id);
    const video = await VideoService.findClientOne(id, currentUserId);

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const getFavorites: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const params = req.query as { page: string; max: string };

    const { videos, count } = await VideoService.findClientByFavorites(
      req.user.id,
      params
    );

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const toggleFavorites: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { videoId } = req.body;

    const video = await VideoService.updateFavorites(videoId, req.user.id);

    res.json({ message: 'Added video to favorites', video });
  } catch (err) {
    return next(err);
  }
};

export const initiateVideoUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { videoId, isRoot, fileName, fileType } = req.body;

    const key = `videos/${req.user.id}/${videoId}/${fileName}`;

    const uploadData = await UploadService.initiateMutlipart(
      fileType,
      isRoot,
      key
    );

    res.json({ uploadId: uploadData.UploadId });
  } catch (err) {
    return next(err);
  }
};

export const processVideoUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { videoId, fileName, partNumber } = req.body;
    const { uploadId } = req.params;

    const key = `videos/${req.user.id}/${videoId}/${fileName}`;

    const presignedUrl = await UploadService.processMultipart(
      uploadId,
      partNumber,
      key
    );

    res.json({ presignedUrl });
  } catch (err) {
    return next(err);
  }
};

export const completeVideoUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { videoId, fileName, parts } = req.body;
    const { uploadId } = req.params;

    const key = `videos/${req.user.id}/${videoId}/${fileName}`;

    const result = await UploadService.completeMultipart(uploadId, parts, key);

    res.json({ url: result.Key });
  } catch (err) {
    return next(err);
  }
};

export const cancelVideoUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { videoId, fileName } = req.query;
    const { uploadId } = req.params;

    const key = `videos/${req.user.id}/${videoId}/${fileName}`;

    await UploadService.cancelMultipart(uploadId, key);

    res.json({ message: 'Video upload cancelled' });
  } catch (err) {
    return next(err);
  }
};

export const uploadThumbnail: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { thumbnail, fileType } = req.body as {
      thumbnail: { name: string; url: string };
      fileType: string;
    };

    const { presignedUrl, key } = await UploadService.uploadImage(
      fileType,
      thumbnail.url
    );

    res.json({ presignedUrl, key });
  } catch (err) {
    return next(err);
  }
};

export const deleteThumbnail: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { key } = req.query as { [key: string]: string };

    await UploadService.deleteImage(key);

    res.json({ message: 'Thumbnail deleted' });
  } catch (err) {
    return next(err);
  }
};
