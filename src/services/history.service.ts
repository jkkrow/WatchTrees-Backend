import { Types } from 'mongoose';

import * as VideoTreeService from '../services/video-tree.service';
import { HistoryModel, HistoryDTO } from '../models/history';
import { VideoTreeClient } from '../models/video-tree';
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
  skipFullyWatched: boolean;
}) => {
  const result = await HistoryModel.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    { $match: skipFullyWatched ? { isEnded: false } : {} },
    { $sort: { updatedAt: -1 } },
    {
      $facet: {
        videos: [
          { $skip: +max * (+page - 1) },
          { $limit: +max },
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
          { $replaceRoot: { newRoot: '$video' } },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
    { $unwind: '$totalCount' },
  ]);

  const videos: VideoTreeClient[] = result.length ? result[0].videos : [];
  const count: number = result.length ? result[0].totalCount.count : 0;

  return { videos, count };
};

export const put = async (history: HistoryDTO, userId: string) => {
  const video = await VideoTreeService.findById(history.tree);

  if (!video) {
    return;
  }

  return await HistoryModel.updateOne(
    {
      user: new Types.ObjectId(userId),
      tree: new Types.ObjectId(history.tree),
    },
    { $set: history },
    { upsert: true }
  );
};

export const remove = async (treeId: string, userId: string) => {
  const history = await HistoryModel.findOne({
    user: userId,
    tree: treeId,
  });

  if (!history) {
    return;
  }

  return await history.remove();
};

export const deleteByUser = async (userId: string) => {
  return await HistoryModel.deleteMany({
    user: new Types.ObjectId(userId),
  });
};

export const deleteByVideoTree = async (treeId: string) => {
  return await HistoryModel.deleteMany({
    tree: new Types.ObjectId(treeId),
  });
};
