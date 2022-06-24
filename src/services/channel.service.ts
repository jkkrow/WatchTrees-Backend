import { Types } from 'mongoose';

import { UserModel } from '../models/user';
import { HttpError } from '../models/error';
import { channelPipe } from './pipelines/channel.pipeline';

export const find = async ({
  match = {},
  sort = {},
  page = 1,
  max = 12,
  userId,
}: {
  match?: any;
  sort?: any;
  page?: number | string;
  max?: number | string;
  userId?: string;
}) => {
  const result = await UserModel.aggregate([
    { $match: match },
    {
      $facet: {
        channels: [
          { $sort: { ...sort, _id: -1 } },
          { $skip: +max * (+page - 1) },
          { $limit: +max },
          ...channelPipe(userId),
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
    { $unwind: '$totalCount' },
  ]);

  return {
    channels: result.length ? result[0].channels : [],
    count: result.length ? result[0].totalCount.count : 0,
  };
};

export const findById = async (params: { id: string; userId: string }) => {
  const result = await find({
    match: { _id: new Types.ObjectId(params.id) },
    ...params,
  });

  return result.channels[0];
};

export const findByKeyword = async (params: {
  search: string;
  page: number | string;
  max: number | string;
  userId?: string;
}) => {
  return await find({
    match: { $text: { $search: params.search } },
    sort: { score: { $meta: 'textScore' } },
    ...params,
  });
};

export const findBySubscribes = async (params: {
  page: number | string;
  max: number | string;
  userId: string;
}) => {
  return await find({
    match: {
      $expr: {
        $in: [new Types.ObjectId(params.userId), '$subscribers'],
      },
    },
    ...params,
  });
};

export const findBySubscribers = async (params: {
  page: number | string;
  max: number | string;
  userId: string;
}) => {
  const result = await UserModel.aggregate([
    {
      $match: { _id: new Types.ObjectId(params.userId) },
    },
    {
      $lookup: {
        from: 'users',
        as: 'subscribers',
        let: { subscribers: '$subscribers' },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$subscribers'] } } },
          {
            $facet: {
              channels: [
                { $skip: +params.max * (+params.page - 1) },
                { $limit: +params.max },
                ...channelPipe(params.userId),
              ],
              totalCount: [{ $count: 'count' }],
            },
          },
          { $unwind: '$totalCount' },
        ],
      },
    },
    { $project: { subscribers: 1 } },
  ]);

  if (!result.length) {
    throw new HttpError(404, 'User not found');
  }

  const { subscribers } = result[0];

  return {
    channels: subscribers.length ? subscribers[0].channels : [],
    count: subscribers.length ? subscribers[0].totalCount.count : 0,
  };
};

export const updateSubscribers = async (id: string, userId: string) => {
  const objectUserId = new Types.ObjectId(userId);
  const result = await UserModel.updateOne({ _id: id }, [
    {
      $set: {
        subscribers: {
          $cond: [
            { $in: [objectUserId, '$subscribers'] },
            { $setDifference: ['$subscribers', [objectUserId]] },
            { $concatArrays: ['$subscribers', [objectUserId]] },
          ],
        },
      },
    },
  ]);

  if (!result.matchedCount) {
    throw new HttpError(404, 'User not found');
  }

  if (!result.modifiedCount) {
    throw new HttpError(500, 'Failed to update subscribes');
  }
};
