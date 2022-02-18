import { Types } from 'mongoose';

import { HistoryModel, History } from '../models/history';
import { rootNodePipe } from './pipelines/video-node.pipeline';
import { creatorInfoPipe, favoritePipe } from './pipelines/video-tree.pipeline';

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
    { $match: skipFullyWatched ? { isEnded: false } : {} },
    { $sort: { updatedAt: -1 } },
    { $skip: +max * (+page - 1) },
    { $limit: +max },
    {
      $facet: {
        videos: [
          {
            $lookup: {
              from: 'videotrees',
              as: 'video',
              let: { tree: '$tree', history: '$$ROOT' },
              pipeline: [
                { $match: { $expr: { $eq: ['$$tree', '$_id'] } } },
                { $addFields: { history: '$$history' } },
                ...rootNodePipe(),
                ...creatorInfoPipe(),
                ...favoritePipe(userId),
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
    user: currentUserId,
    tree: history.tree,
  });

  if (!existingHistory) {
    const newHistory = new HistoryModel({
      user: currentUserId,
      tree: history.tree,
      activeNodeId: history.activeNodeId,
      progress: history.progress,
      totalProgress: history.totalProgress,
      isEnded: history.isEnded,
    });

    return await newHistory.save();
  }

  existingHistory.activeNodeId = history.activeNodeId;
  existingHistory.progress = history.progress;
  existingHistory.totalProgress = history.totalProgress;
  existingHistory.isEnded = history.isEnded;

  return await existingHistory.save();
};

export const remove = async (treeId: string, currentUserId: string) => {
  const history = await HistoryModel.findOne({
    user: currentUserId,
    tree: treeId,
  });

  if (!history) {
    return;
  }

  return await history.remove();
};
