import { RequestHandler } from 'express';

import HttpError from '../models/common/HttpError';
import User from '../models/data/User.model';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page, max } = req.query;

    let count: number;
    const itemsPerPage = max ? +max : 10;
    const pageNumber = page ? +page : 1;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new HttpError(404, 'No user found.');
    }

    count = user.videos.length;

    await user.populate({
      path: 'videos',
      options: {
        sort: { $natural: -1 },
        select: '-root.children -__v',
        limit: itemsPerPage,
        skip: itemsPerPage * (pageNumber - 1),
      },
    });

    res.json({ videos: user.videos, count });
  } catch (err) {
    return next(err);
  }
};
