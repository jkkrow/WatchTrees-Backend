import { RequestHandler } from 'express';

import { HttpError } from '../models/error/HttpError';
import { VideoService, VideoDocument } from '../models/videos/VideoService';
import { findById, traverseNodes } from '../util/tree';

export const fetchPublicVideos: RequestHandler = async (req, res, next) => {
  try {
    const { page, max, userId, search } = req.query;

    const itemsPerPage = max ? +max : 10;
    const pageNumber = page ? +page : 1;

    const { videos, count } = await VideoService.findPublic(
      pageNumber,
      itemsPerPage,
      userId as string,
      search as string
    );

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const fetchCreatedVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page, max } = req.query;

    const pageNumber = page ? +page : 1;
    const itemsPerPage = max ? +max : 10;

    const videos = await VideoService.findCreated(
      req.user.id,
      pageNumber,
      itemsPerPage
    );

    res.json({ videos });
  } catch (err) {
    return next(err);
  }
};

export const fetchCreatedVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const video = await VideoService.findById(id);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    if (video.info.creator.toString() !== req.user.id) {
      throw new HttpError(403, 'Not authorized to this video');
    }

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const fetchPublicVideo: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query;

    const video = await VideoService.findPublicOne(id, currentUserId as string);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const saveVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { uploadTree } = req.body;
    const { id } = req.params;

    let existingVideo: VideoDocument | null = null;
    let videoId: string | undefined;

    if (id !== 'undefined') {
      existingVideo = await VideoService.findById(id);
    }

    /*
     * Refactor UploadTree fields before change document
     */

    const uploadNodes = traverseNodes(uploadTree.root);

    for (let uploadNode of uploadNodes) {
      let nodeInfo = uploadNode.info;

      if (!nodeInfo) continue;

      if (nodeInfo.progress > 0 && nodeInfo.progress < 100) {
        nodeInfo = null;
      }

      if (!existingVideo) continue;

      const videoNode = findById(existingVideo, uploadNode.id);

      if (!videoNode || !videoNode.info || !nodeInfo) continue;

      nodeInfo.isConverted = videoNode.info.isConverted;
      nodeInfo.url = videoNode.info.url;
    }

    /*
     * Create Video
     */

    if (!existingVideo) {
      const { insertedId } = await VideoService.createVideo(
        uploadTree,
        req.user.id
      );

      if (!insertedId) {
        throw new HttpError(500, 'Saving video failed. Please try again');
      }

      videoId = insertedId.toString();
    }

    if (existingVideo) {
      const updatedVideo = {
        ...existingVideo,
        ...uploadTree,
        _id: existingVideo._id,
        info: { ...uploadTree.info, creator: existingVideo.info.creator },
        data: { ...existingVideo.data },
      };

      await VideoService.updateVideo(updatedVideo);
    }

    res.json({ message: 'Upload progress saved', videoId });
  } catch (err) {
    return next(err);
  }
};

export const deleteVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const { deletedCount } = await VideoService.deleteVideo(id, req.user.id);

    if (!deletedCount) {
      throw new HttpError(500, 'Deleting video failed. Please try again');
    }

    // TODO: Delete videos & thumbnail from aws s3

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    return next(err);
  }
};

export const addToFavorites: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const video = await VideoService.findPublicOne(id, req.user.id);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    if (video.data.isFavorite) {
      await VideoService.removeFromFavorites(id, req.user.id);
      video.data.favorites--;
    } else {
      await VideoService.addToFavorites(id, req.user.id);
      video.data.favorites++;
    }

    res.json({
      isFavorite: !video.data.isFavorite,
      favorites: video.data.favorites,
    });
  } catch (err) {
    return next(err);
  }
};
