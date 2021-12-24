import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { S3 } from 'aws-sdk';
import { ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import { parse } from 'path';

import { HttpError } from '../models/error/HttpError';
import { UserService } from '../models/users/UserService';
import { VideoService } from '../models/videos/VideoService';

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_BUCKET_REGION!,
});

export const updateUserName: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { name } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    await UserService.updateUser(req.user.id, { $set: { name } });

    res.json({ message: 'User name updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { currentPassword, newPassword } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404);
    }

    const correctPassword = await UserService.checkPassword(
      user,
      currentPassword
    );

    if (!correctPassword) {
      throw new HttpError(422, 'Invalid password.');
    }

    await UserService.updateUser(req.user.id, {
      $set: { password: newPassword },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const updatePicture: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { isNewFile, fileType } = req.body;

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404);
    }

    let presignedUrl = '';
    let newPicture = '';

    if (isNewFile) {
      const { dir, name } = parse(fileType);

      if (dir !== 'image') {
        throw new HttpError(422, 'Invalid file type');
      }

      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture || `images/${req.user.id}/${uuidv1()}.${name}`,
        ContentType: fileType,
      };

      presignedUrl = await s3.getSignedUrlPromise('putObject', params);

      await UserService.updateUser(req.user.id, {
        $set: { picture: params.Key },
      });

      newPicture = params.Key;
    }

    if (!isNewFile && user.picture) {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture,
      };

      await s3.deleteObject(params).promise();

      await UserService.updateUser(req.user.id, {
        $set: { picture: '' },
      });
    }

    res.json({
      presignedUrl,
      newPicture,
      message: 'Picture updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
};

export const fetchChannel: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query as { [key: string]: string };

    const channelInfo = await UserService.findChannel(id, currentUserId);

    if (!channelInfo) {
      throw new HttpError(404, 'No Channel found');
    }

    res.json({ channelInfo });
  } catch (err) {
    return next(err);
  }
};

export const subscribeChannel: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const channelInfo = await UserService.findChannel(id, req.user.id);

    if (!channelInfo) {
      throw new HttpError(404, 'No Channel found');
    }

    if (channelInfo.isSubscribed) {
      await UserService.unsubscribe(id, req.user.id);
      channelInfo.subscribers--;
    } else {
      await UserService.subscribe(id, req.user.id);
      channelInfo.subscribers++;
    }

    res.json({
      isSubscribed: !channelInfo.isSubscribed,
      subscribers: channelInfo.subscribers,
    });
  } catch (err) {
    return next(err);
  }
};

export const fetchSubscribes: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const subscribes = await UserService.findSubscribes(req.user.id);

    res.json({ subscribes });
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

    const { videos, count } = await UserService.findHistory(
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

    const { videos, count } = await VideoService.findVideoList({
      match: matchFilter,
    });

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const addToHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { history } = req.body;

    await UserService.addToHistory(req.user.id, history);

    res.json({ message: 'Added video to history' });
  } catch (err) {
    return next(err);
  }
};

export const removeFromHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { historyId } = req.query as { [key: string]: string };

    await UserService.removeFromHistory(req.user.id, historyId);

    res.json({ message: 'Removed videoe from history' });
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

    const { videos, count } = await UserService.findFavorites(
      req.user.id,
      pageNumber,
      itemsPerPage
    );

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const addToFavorites: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { videoId } = req.body;

    const video = await VideoService.findVideoItem(videoId, req.user.id);

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    if (video.data.isFavorite) {
      await UserService.removeFromFavorites(videoId, req.user.id);
      video.data.favorites--;
    } else {
      await UserService.addToFavorites(videoId, req.user.id);
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
