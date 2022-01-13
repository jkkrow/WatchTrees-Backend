import { FindOptions, WithId, ObjectId } from 'mongodb';

import { client } from '../../config/db';
import {
  VideoTree,
  VideoListDetail,
  VideoItemDetail,
  VideoSchema,
} from './Video';
import { History } from '../users/User';
import { UserDocument } from '../users/UserService';
import { attachCreatorInfo, attachHistory } from '../../util/pipelines';

const collectionName = 'videos';
const userCollectionName = 'users';

export interface VideoDocument extends WithId<VideoTree> {}

export class VideoService {
  static findById(id: string, options?: FindOptions) {
    const videoId = new ObjectId(id);

    return client
      .db()
      .collection(collectionName)
      .findOne({ _id: videoId }, options) as Promise<VideoDocument | null>;
  }

  static async getVideoItem(id: string, currentUserId: string) {
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

  static async getVideoList({
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

  static async getHistory(
    id: string,
    page: number,
    max: number,
    skipFullyWatched = false
  ) {
    const userId = new ObjectId(id);

    const creatorPipeline = attachCreatorInfo();
    const extraMatchPipeline = skipFullyWatched
      ? [{ $match: { 'history.progress.isEnded': false } }]
      : [];

    const result = await client
      .db()
      .collection<UserDocument>(userCollectionName)
      .aggregate([
        { $match: { _id: userId } },
        { $unwind: '$history' },
        {
          $facet: {
            videos: [
              ...extraMatchPipeline,
              { $sort: { 'history.updatedAt': -1 } },
              { $skip: max * (page - 1) },
              { $limit: max },
              {
                $lookup: {
                  from: 'videos',
                  as: 'history',
                  let: { history: '$history' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$$history.video', '$_id'] } } },
                    { $project: { 'root.children': 0 } },
                    {
                      $addFields: {
                        'data.favorites': { $size: '$data.favorites' },
                        history: '$$history',
                      },
                    },
                    ...creatorPipeline,
                  ],
                },
              },
              { $unwind: '$history' },
              {
                $group: {
                  _id: '$_id',
                  videos: { $push: '$history' },
                },
              },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
        { $unwind: '$videos' },
        { $unwind: '$totalCount' },
      ])
      .toArray();

    const videos = result.length ? result[0].videos.videos : [];
    const count = result.length ? result[0].totalCount.count : 0;

    return { videos, count };
  }

  static async getFavorites(id: string, page: number, max: number) {
    const userId = new ObjectId(id);

    const creatorPipeline = attachCreatorInfo();
    const historyPipeline = attachHistory(userId);

    const result = await client
      .db()
      .collection<UserDocument>(userCollectionName)
      .aggregate([
        { $match: { _id: userId } },
        {
          $lookup: {
            from: 'videos',
            as: 'favorites',
            let: { favorites: '$favorites' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$favorites'] } } },
              {
                $facet: {
                  videos: [
                    { $sort: { _id: -1 } },
                    { $skip: max * (page - 1) },
                    { $limit: max },
                    { $project: { 'root.children': 0 } },
                    {
                      $addFields: {
                        'data.favorites': { $size: '$data.favorites' },
                      },
                    },
                    ...creatorPipeline,
                    ...historyPipeline,
                  ],
                  totalCount: [{ $count: 'count' }],
                },
              },
              { $unwind: '$totalCount' },
            ],
          },
        },
        { $project: { favorites: 1 } },
      ])
      .toArray();

    const { favorites } = result[0];

    const videos = favorites.length ? favorites[0].videos : [];
    const count = favorites.length ? favorites[0].totalCount.count : 0;

    return { videos, count };
  }

  static createVideo(video: VideoTree, creatorId: string) {
    const newVideo = new VideoSchema(video, creatorId);

    return client.db().collection(collectionName).insertOne(newVideo);
  }

  static updateVideo(video: VideoDocument) {
    const newVideo = video;

    newVideo._id = new ObjectId(newVideo._id);
    newVideo.info.creator = new ObjectId(newVideo.info.creator);

    return client
      .db()
      .collection(collectionName)
      .replaceOne(
        { _id: newVideo._id, 'info.creator': newVideo.info.creator },
        newVideo
      );
  }

  static deleteVideo(id: string, creatorId: string) {
    const videoId = new ObjectId(id);
    const userId = new ObjectId(creatorId);

    return client.db().collection(collectionName).deleteOne({
      _id: videoId,
      'info.creator': userId,
    });
  }

  static incrementViews(id: string) {
    const videoId = new ObjectId(id);

    return client
      .db()
      .collection(collectionName)
      .updateOne({ _id: videoId }, { $inc: { 'data.views': 1 } });
  }

  static async addToHistory(id: string, history: History) {
    const userId = new ObjectId(id);
    const newHistory = history;

    newHistory.video = new ObjectId(newHistory.video);
    newHistory.updatedAt = new Date(newHistory.updatedAt);

    const collection = client.db().collection<UserDocument>(userCollectionName);

    const result = await collection.updateOne(
      { _id: userId, 'history.video': newHistory.video },
      { $set: { 'history.$': newHistory } }
    );

    if (!result.modifiedCount) {
      await collection.updateOne(
        { _id: userId },
        { $addToSet: { history: newHistory } }
      );
    }
  }

  static async removeFromHistory(id: string, historyId: string) {
    const userId = new ObjectId(id);
    const historyVideoId = new ObjectId(historyId);

    await client
      .db()
      .collection<UserDocument>(userCollectionName)
      .updateOne(
        { _id: userId },
        { $pull: { history: { video: historyVideoId } } }
      );
  }

  static async addToFavorites(targetId: string, currentUserId: string) {
    const videoId = new ObjectId(targetId);
    const userId = new ObjectId(currentUserId);

    const session = client.startSession();
    const videoCollection = client.db().collection(collectionName);
    const userCollection = client
      .db()
      .collection<UserDocument>(userCollectionName);

    await session.withTransaction(async () => {
      await Promise.all([
        videoCollection.updateOne(
          { _id: videoId },
          { $addToSet: { 'data.favorites': userId } }
        ),
        userCollection.updateOne(
          { _id: userId },
          { $addToSet: { favorites: videoId } }
        ),
      ]);
    });

    await session.endSession();
  }

  static async removeFromFavorites(targetId: string, currentUserId: string) {
    const videoId = new ObjectId(targetId);
    const userId = new ObjectId(currentUserId);

    const session = client.startSession();
    const videoCollection = client.db().collection(collectionName);
    const userCollection = client
      .db()
      .collection<UserDocument>(userCollectionName);

    await session.withTransaction(async () => {
      await Promise.all([
        videoCollection.updateOne(
          { _id: videoId },
          { $pull: { 'data.favorites': userId } }
        ),
        userCollection.updateOne(
          { _id: userId },
          { $pull: { favorites: videoId } }
        ),
      ]);
    });

    await session.endSession();
  }
}
