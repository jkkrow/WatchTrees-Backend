import { Types } from 'mongoose';

import { UserModel } from '../models/user';
import { channelPipeline } from './pipelines/channel.pipeline';

export const find = async ({
  match = {},
  sort = {},
  page = 1,
  max = 12,
  currentUserId,
}: {
  match?: any;
  sort?: any;
  page?: number | string;
  max?: number | string;
  currentUserId?: string;
}) => {
  const result = await UserModel.aggregate([
    { $match: { ...match } },
    {
      $facet: {
        channels: [
          { $sort: { ...sort, _id: -1 } },
          { $skip: +max * (+page - 1) },
          { $limit: +max },
          ...channelPipeline(currentUserId),
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

export const findById = async (params: {
  id: string;
  currentUserId: string;
}) => {
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
  currentUserId?: string;
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
  currentUserId: string;
}) => {
  return await find({
    match: {
      $expr: {
        $in: [new Types.ObjectId(params.currentUserId), '$subscribers'],
      },
    },
    ...params,
  });
};

export const findBySubscribers = async (params: {
  page: number | string;
  max: number | string;
  currentUserId: string;
}) => {
  const result = await UserModel.aggregate([
    { $match: { _id: new Types.ObjectId(params.currentUserId) } },
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
                ...channelPipeline(params.currentUserId),
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

  return {
    channels: result.length ? result[0].subscribers[0].channels : [],
    count: result.length ? result[0].subscribers[0].totalCount.count : 0,
  };
};

export const updateSubscribers = async (id: string, currentUserId: string) => {
  const objectUserId = new Types.ObjectId(currentUserId);
  await UserModel.updateOne({ _id: id }, [
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
};
