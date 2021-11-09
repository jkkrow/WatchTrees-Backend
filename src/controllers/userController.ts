import { RequestHandler } from 'express';

import HttpError from '../models/common/HttpError';
import User from '../models/data/User.model';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page } = req.query;

    let totalPage: number;
    const itemsPerPage = 10;
    const pageNumber = page ? +page : 1;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new HttpError(404, 'No user found.');
    }

    totalPage = Math.ceil(user.videos.length / itemsPerPage);

    await user.populate({
      path: 'videos',
      options: {
        sort: { $natural: -1 },
        select: '-root.children -__v',
        limit: itemsPerPage,
        skip: itemsPerPage * (pageNumber - 1),
      },
    });

    console.log(user.videos[0]);

    res.json({ videos: user.videos, totalPage });
  } catch (err) {
    next(err);
  }
};
