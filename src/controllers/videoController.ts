import { RequestHandler } from 'express';
import { ObjectId } from 'mongodb';

import { HttpError } from '../models/error/HttpError';
import { VideoService, VideoDocument } from '../models/videos/VideoService';
import { findById, traverseNodes } from '../util/tree';

export const fetchPublicVideos: RequestHandler = async (req, res, next) => {
  try {
    const { page, max, search, channelId, currentUserId } = req.query as {
      [key: string]: string;
    };

    const pageNumber = page ? +page : 1;
    const itemsPerPage = max ? +max : 12;
    const userId = currentUserId ? `${currentUserId}` : '';

    const matchFilter: any = {
      'info.status': 'public',
      'info.isEditing': false,
    };
    const sortFilter: any = {};

    if (search) {
      matchFilter['$text'] = { $search: search };
      sortFilter.score = { $meta: 'textScore' };
    }

    if (channelId) {
      matchFilter['info.creator'] = new ObjectId(channelId);
    }

    sortFilter._id = -1;

    const { videos, count } = await VideoService.getVideoList({
      match: matchFilter,
      sort: sortFilter,
      page: pageNumber,
      max: itemsPerPage,
      currentUserId: userId,
    });

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
    const itemsPerPage = max ? +max : 12;

    const { videos, count } = await VideoService.getVideoList({
      match: { 'info.creator': new ObjectId(req.user.id) },
      page: pageNumber,
      max: itemsPerPage,
    });

    res.json({ videos, count });
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

export const fetchVideo: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query as { [key: string]: string };

    await VideoService.incrementViews(id);

    const video = await VideoService.getVideoItem(id, currentUserId);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const fetchHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page, max, skipFullyWatched } = req.query;

    const pageNumber = page ? +page : 1;
    const itemsPerPage = max ? +max : 12;

    const { videos, count } = await VideoService.getHistory(
      req.user.id,
      pageNumber,
      itemsPerPage,
      skipFullyWatched ? true : false
    );

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const fetchLocalHistory: RequestHandler = async (req, res, next) => {
  try {
    const { localHistory } = req.query as { [key: string]: string[] };

    const matchFilter = {
      _id: { $in: localHistory.map((history) => new ObjectId(history)) },
    };

    const { videos, count } = await VideoService.getVideoList({
      match: matchFilter,
    });

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const fetchFavorites: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page, max } = req.query;

    const pageNumber = page ? +page : 1;
    const itemsPerPage = max ? +max : 12;

    const { videos, count } = await VideoService.getFavorites(
      req.user.id,
      pageNumber,
      itemsPerPage
    );

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const saveVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { uploadTree } = req.body;

    let existingVideo: VideoDocument | null = null;
    let videoId: string | undefined;

    if (uploadTree._id) {
      existingVideo = await VideoService.findById(uploadTree._id);

      if (
        existingVideo &&
        existingVideo.info.creator.toString() !== req.user.id
      ) {
        throw new HttpError(403, 'Not authorized to this video');
      }
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
        createdAt: new Date(existingVideo.createdAt),
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

export const addToHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { history } = req.body;

    await VideoService.addToHistory(req.user.id, history);

    res.json({ message: 'Added video to history' });
  } catch (err) {
    return next(err);
  }
};

export const removeFromHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { historyId } = req.query as { [key: string]: string };

    await VideoService.removeFromHistory(req.user.id, historyId);

    res.json({ message: 'Removed videoe from history' });
  } catch (err) {
    return next(err);
  }
};

export const toggleFavorites: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { videoId } = req.body;

    const video = await VideoService.getVideoItem(videoId, req.user.id);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    if (video.data.isFavorite) {
      await VideoService.removeFromFavorites(videoId, req.user.id);
      video.data.favorites--;
    } else {
      await VideoService.addToFavorites(videoId, req.user.id);
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
