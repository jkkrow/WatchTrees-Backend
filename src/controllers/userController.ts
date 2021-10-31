import { RequestHandler } from 'express';

import HttpError from '../models/common/HttpError';
import User from '../models/data/User.model';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const user = await User.findById(req.user.id).populate({
      path: 'videos',
      options: { limit: 10, select: '-root -__v' },
    });

    if (!user) {
      throw new HttpError(404, 'No user found.');
    }

    res.json({ videos: user.videos });
  } catch (err) {
    next(err);
  }
};
