import * as HistoryService from '../services/history.service';
import { asyncHandler } from '../util/async-handler';

export const getHistory = asyncHandler(async (req, res) => {
  if (!req.user) return;

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
});

export const putHistory = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { history } = req.body;

  await HistoryService.put(history, req.user.id);

  res.json({ message: 'Added video to history' });
});

export const removeHistory = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId } = req.query as { [key: string]: string };

  await HistoryService.remove(videoId, req.user.id);

  res.json({ message: 'Removed videoe from history' });
});
