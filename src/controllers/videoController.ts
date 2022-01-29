import { RequestHandler } from 'express';

import * as VideoService from '../services/video.service';
import { HttpError } from '../models/error';

export const getVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { page, max } = req.query;

    const pageNumber = page ? +page : 1;
    const itemsPerPage = max ? +max : 12;

    const { videos, count } = await VideoService.getVideoClients({
      match: { 'info.creator': req.user.id },
      page: pageNumber,
      max: itemsPerPage,
    });

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const getVideo: RequestHandler = async (req, res, next) => {
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

export const getClientVideos: RequestHandler = async (req, res, next) => {
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
      matchFilter['info.creator'] = channelId;
    }

    sortFilter._id = -1;

    const { videos, count } = await VideoService.getVideoClients({
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

export const getClientVideo: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query as { [key: string]: string };

    const video = await VideoService.getVideoClient(id, currentUserId);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    await VideoService.incrementViews(id);

    res.json({ video });
  } catch (err) {
    return next(err);
  }
};

export const getHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { page, max, skipFullyWatched } = req.query;

    const pageNumber = page ? +page : 1;
    const itemsPerPage = max ? +max : 12;

    const { videos, count } = await VideoService.getVideoHistory(
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

export const getLocalHistory: RequestHandler = async (req, res, next) => {
  try {
    const { localHistory } = req.query as { [key: string]: string[] };

    const matchFilter = { _id: { $in: localHistory } };

    const { videos, count } = await VideoService.getVideoClients({
      match: matchFilter,
    });

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const getFavorites: RequestHandler = async (req, res, next) => {
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

    const video = await VideoService.getVideoClient(videoId, req.user.id);

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
