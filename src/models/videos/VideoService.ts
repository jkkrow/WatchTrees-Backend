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

  static async findPublicOne(id: string, currentUserId: string) {
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
            'data.isFavorite': {
              $in: [
                currentUserId ? new ObjectId(currentUserId) : '',
                '$data.favorites',
              ],
            },
          },
        },
      ])
      .toArray();

    return result[0];
  }

  static async findPublic(
    page: number,
    max: number,
    creatorId: string,
    keyword: string
  ) {
    const filter: any = {};
    const sort: any = { $sort: {} };

    if (creatorId) {
      filter['info.creator'] = new ObjectId(creatorId);
    }

    if (keyword) {
      filter['$text'] = { $search: keyword };
      sort['$sort'].score = { $meta: 'textScore' };
    }

    sort['$sort']._id = -1;

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
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
        { $unwind: '$totalCount' },
      ])
      .toArray();

    const videos = result.length ? result[0].videos : [];
    const count = result.length ? result[0].totalCount.count : 0;

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
