import { RequestHandler } from 'express';

import * as HistoryService from '../services/history.service';

export const getHistory: RequestHandler = async (req, res, next) => {
  if (!req.user) return;
  try {
    const { page, max, skipFullyWatched } = req.query as {
      [key: string]: string;
    };

    const { videos, count } = await HistoryService.find(
      req.user.id,
      page,
      max,
      skipFullyWatched ? true : false
    );

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
