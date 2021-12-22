import { FindOptions, WithId, ObjectId } from 'mongodb';

import { client } from '../../config/db';
import {
  VideoTree,
  VideoListDetail,
  VideoItemDetail,
  VideoSchema,
} from './Video';
import { attachCreatorInfo, attachHistory } from '../../util/pipelines';

const collectionName = 'videos';

export interface VideoDocument extends WithId<VideoTree> {}

export class VideoService {
  static findById(id: string, options?: FindOptions) {
    const videoId = new ObjectId(id);

    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .findOne({ _id: videoId }, options);
  }

  static async findVideoItem(id: string, currentUserId: string) {
    const videoId = new ObjectId(id);
    const userId = currentUserId ? new ObjectId(currentUserId) : '';

    const creatorPipeline = attachCreatorInfo();
    const historyPipeline = userId ? attachHistory(userId) : [];

    const result = await client
      .db()
      .collection<WithId<VideoItemDetail>>(collectionName)
      .aggregate([
        { $match: { _id: videoId } },
        {
          $addFields: {
            'data.favorites': { $size: '$data.favorites' },
            'data.isFavorite': currentUserId
              ? { $in: [userId, '$data.favorites'] }
              : false,
          },
        },
        ...creatorPipeline,
        ...historyPipeline,
      ])
      .toArray();

    return result[0];
  }

  static async findVideoList({
    match,
    sort,
    page,
    max,
    currentUserId,
  }: {
    match: any;
    sort?: any;
    page?: number;
    max?: number;
    currentUserId?: string;
  }) {
    const userId = currentUserId ? new ObjectId(currentUserId) : '';

    const sortPipeline = sort ? [{ $sort: sort }] : [{ $sort: { _id: -1 } }];
    const skipPipeline = page && max ? [{ $skip: max * (page - 1) }] : [];
    const limitPipeline = max ? [{ $limit: max }] : [];
    const creatorPipeline = attachCreatorInfo();
    const historyPipeline = userId ? attachHistory(userId) : [];

    const result = await client
      .db()
      .collection<WithId<VideoListDetail>>(collectionName)
      .aggregate([
        { $match: match },
        {
          $facet: {
            videos: [
              ...sortPipeline,
              ...skipPipeline,
              ...limitPipeline,
              { $project: { 'root.children': 0 } },
              {
                $addFields: { 'data.favorites': { $size: '$data.favorites' } },
              },
              ...creatorPipeline,
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

    return { videos, count };
  }

  static createVideo(video: VideoTree, creatorId: string) {
    const newVideo = new VideoSchema(video, creatorId);

    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .insertOne(newVideo);
  }

  static updateVideo(video: VideoDocument) {
    const newVideo = video;

    newVideo._id = new ObjectId(newVideo._id);
    newVideo.info.creator = new ObjectId(newVideo.info.creator);

    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .replaceOne(
        { _id: newVideo._id, 'info.creator': newVideo.info.creator },
        newVideo
      );
  }

  static incrementViews(id: string) {
    const videoId = new ObjectId(id);

    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .updateOne({ _id: videoId }, { $inc: { 'data.views': 1 } });
  }

  static deleteVideo(id: string, creatorId: string) {
    const videoId = new ObjectId(id);
    const userId = new ObjectId(creatorId);

    return client.db().collection<VideoDocument>(collectionName).deleteOne({
      _id: videoId,
      'info.creator': userId,
    });
  }
}
