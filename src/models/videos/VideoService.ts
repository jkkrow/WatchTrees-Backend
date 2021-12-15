import { FindOptions, WithId, ObjectId } from 'mongodb';

import { client } from '../../config/db';
import {
  VideoTree,
  VideoListDetail,
  VideoItemDetail,
  VideoSchema,
} from './Video';

const collectionName = 'videos';

export interface VideoDocument extends WithId<VideoTree> {}

export class VideoService {
  static findById(id: string | ObjectId, options?: FindOptions) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .findOne({ _id: new ObjectId(id) }, options);
  }

  static async findOneWithDetail(id: string, currentUserId: string) {
    const historyPipeline = currentUserId
      ? [
          {
            $lookup: {
              from: 'users',
              as: 'history',
              let: { id: '$_id' },
              pipeline: [
                { $match: { _id: new ObjectId(currentUserId) } },
                {
                  $project: {
                    history: {
                      $filter: {
                        input: '$history',
                        as: 'item',
                        cond: { $eq: ['$$item.video', '$$id'] },
                      },
                    },
                  },
                },
                { $project: { history: { $arrayElemAt: ['$history', 0] } } },
              ],
            },
          },
          { $unwind: '$history' },
          {
            $addFields: {
              history: {
                progress: '$history.history.progress',
                updatedAt: '$history.history.updatedAt',
              },
            },
          },
          { $project: { history: { _id: 0, history: 0 } } },
          {
            $addFields: {
              history: {
                $cond: {
                  if: { $eq: ['$history', {}] },
                  then: null,
                  else: '$history',
                },
              },
            },
          },
        ]
      : [];

    const result = await client
      .db()
      .collection<WithId<VideoItemDetail>>(collectionName)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            as: 'info.creatorInfo',
            let: { creator: '$info.creator' },
            pipeline: [
              { $match: { $expr: { $eq: ['$$creator', '$_id'] } } },
              { $project: { _id: 0, name: 1, picture: 1 } },
            ],
          },
        },
        { $unwind: '$info.creatorInfo' },
        {
          $addFields: {
            'data.favorites': { $size: '$data.favorites' },
            'data.isFavorite': currentUserId
              ? { $in: [new ObjectId(currentUserId), '$data.favorites'] }
              : false,
          },
        },
        ...historyPipeline,
      ])
      .toArray();

    return result[0];
  }

  static async findPublic(
    page: number,
    max: number,
    keyword: string,
    channelId: string,
    currentUserId: string
  ) {
    const filter: any = {};
    const sort: any = { $sort: {} };

    if (channelId) {
      filter['info.creator'] = new ObjectId(channelId);
    }

    if (keyword) {
      filter['$text'] = { $search: keyword };
      sort['$sort'].score = { $meta: 'textScore' };
    }

    sort['$sort']._id = -1;

    const historyPipeline = currentUserId
      ? [
          {
            $lookup: {
              from: 'users',
              as: 'history',
              let: { id: '$_id' },
              pipeline: [
                { $match: { _id: new ObjectId(currentUserId) } },
                {
                  $project: {
                    history: {
                      $filter: {
                        input: '$history',
                        as: 'item',
                        cond: { $eq: ['$$item.video', '$$id'] },
                      },
                    },
                  },
                },
                { $project: { history: { $arrayElemAt: ['$history', 0] } } },
              ],
            },
          },
          { $unwind: '$history' },
          {
            $addFields: {
              history: {
                progress: '$history.history.progress',
                updatedAt: '$history.history.updatedAt',
              },
            },
          },
          { $project: { history: { _id: 0, history: 0 } } },
          {
            $addFields: {
              history: {
                $cond: {
                  if: { $eq: ['$history', {}] },
                  then: null,
                  else: '$history',
                },
              },
            },
          },
        ]
      : [];

    const result = await client
      .db()
      .collection<WithId<VideoListDetail>>(collectionName)
      .aggregate([
        {
          $match: {
            'info.status': 'public',
            'info.isEditing': false,
            ...filter,
          },
        },
        {
          $facet: {
            videos: [
              sort,
              { $skip: max * (page - 1) },
              { $limit: max },
              {
                $lookup: {
                  from: 'users',
                  as: 'info.creatorInfo',
                  let: { creator: '$info.creator' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$$creator', '$_id'] } } },
                    { $project: { _id: 0, name: 1, picture: 1 } },
                  ],
                },
              },
              { $unwind: '$info.creatorInfo' },
              { $project: { 'root.children': 0 } },
              {
                $addFields: { 'data.favorites': { $size: '$data.favorites' } },
              },
              ...historyPipeline,
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
        { $unwind: '$totalCount' },
      ])
      .toArray();

    const videos = result.length ? result[0].videos : [];
    const count = result.length ? result[0].totalCount.count : 0;

    console.log(videos);

    return { videos, count };
  }

  static findCreated(creatorId: string, page: number, max: number) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .aggregate([
        { $match: { 'info.creator': new ObjectId(creatorId) } },
        { $sort: { _id: -1 } },
        { $skip: max * (page - 1) },
        { $limit: max },
        { $project: { 'root.children': 0 } },
        { $addFields: { 'data.favorites': { $size: '$data.favorites' } } },
      ])
      .toArray();
  }

  static createVideo(video: VideoTree, creatorId: string) {
    const newVideo = new VideoSchema(video, creatorId);

    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .insertOne(newVideo);
  }

  static updateVideo(video: VideoDocument) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .replaceOne(
        {
          _id: new ObjectId(video._id),
          'info.creator': new ObjectId(video.info.creator),
        },
        video
      );
  }

  static incrementViews(videoId: string | ObjectId) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .updateOne({ _id: new ObjectId(videoId) }, { $inc: { 'data.views': 1 } });
  }

  static deleteVideo(videoId: string | ObjectId, creatorId: string) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .deleteOne({
        _id: new ObjectId(videoId),
        'info.creator': new ObjectId(creatorId),
      });
  }
}
