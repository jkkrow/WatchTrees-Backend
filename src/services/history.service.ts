import { Types } from 'mongoose';

import { HistoryModel, History } from '../models/history';
import {
  creatorInfoPipeline,
  favoritesPipeline,
} from './pipelines/video.pipeline';

export const find = async ({
  userId,
  page = 1,
  max = 12,
  skipFullyWatched = false,
}: {
  userId: string;
  page: number | string;
  max: number | string;
  skipFullyWatched: boolean | string;
}) => {
  const result = await HistoryModel.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    { $match: skipFullyWatched ? { 'progress.isEnded': false } : {} },
    { $sort: { updatedAt: -1 } },
    { $skip: +max * (+page - 1) },
    { $limit: +max },
    {
      $facet: {
        videos: [
          {
            $lookup: {
              from: 'videos',
              as: 'video',
              let: { video: '$video', history: '$$ROOT' },
              pipeline: [
                { $match: { $expr: { $eq: ['$$video', '$_id'] } } },
                { $project: { 'root.children': 0 } },
                { $addFields: { history: '$$history' } },
                ...creatorInfoPipeline(),
                ...favoritesPipeline(userId),
              ],
            },
          },
          { $unwind: '$video' },
          { $project: { video: 1 } },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
    { $unwind: '$totalCount' },
  ]);

  return {
    videos: result.length
      ? result[0].videos.map((video: any) => video.video)
      : [],
    count: result.length ? result[0].totalCount.count : 0,
  };
};

export const put = async (history: History, currentUserId: string) => {
  const existingHistory = await HistoryModel.findOne({
    video: history.video,
    user: currentUserId,
  });

  if (!existingHistory) {
    const newHistory = new HistoryModel({
      user: currentUserId,
      video: history.video,
      progress: history.progress,
    });

    return await newHistory.save();
  }

  existingHistory.progress = history.progress;

  return await existingHistory.save();
};

export const remove = async (videoId: string, currentUserId: string) => {
  const history = await HistoryModel.findOne({
    user: currentUserId,
    video: videoId,
  });

  if (!history) {
    return;
  }

  return await history.remove();
};
