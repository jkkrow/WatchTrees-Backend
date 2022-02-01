import { RequestHandler } from 'express';

import * as HistoryService from '../services/history.service';

export const getHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const params = req.query as {
      page: string;
      max: string;
      skipFullyWatched: string;
    };

    const { videos, count } = await HistoryService.find({
      userId: req.user.id,
      ...params,
    });

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const putHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { history } = req.body;

    await HistoryService.put(history, req.user.id);

    res.json({ message: 'Added video to history' });
  } catch (err) {
    return next(err);
  }
};

export const removeHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { videoId } = req.query as { [key: string]: string };

    await HistoryService.remove(videoId, req.user.id);

    res.json({ message: 'Removed videoe from history' });
  } catch (err) {
    return next(err);
  }
};
