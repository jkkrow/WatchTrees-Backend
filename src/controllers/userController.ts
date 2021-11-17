import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

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
      path: 'history',
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

export const fetchHistory: RequestHandler = async (req, res, next) => {
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

export const updateUserName: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { name } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new HttpError(404, 'No user found');
    }

    user.name = name;

    await user.save();

    res.json({ message: 'User name changed successfully' });
  } catch (err) {
    return next(err);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new HttpError(404, 'No user found');
    }

    user.password = password;

    user.hashPassword();

    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return next(err);
  }
};
