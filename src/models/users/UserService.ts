import { Filter, FindOptions, UpdateFilter, WithId, ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { client } from '../../config/db';
import { User, Channel, History, UserSchema } from './User';
import { VideoDocument } from '../videos/VideoService';
import { createToken } from '../../services/jwt-token';
import { attachCreatorInfo, attachHistory } from '../../util/pipelines';

const collectionName = 'users';

export interface UserDocument extends WithId<User> {}

export class UserService {
  static findById(id: string, options?: FindOptions) {
    const userId = new ObjectId(id);

    return client
      .db()
      .collection<UserDocument>(collectionName)
      .findOne({ _id: userId }, options);
  }

  static findOne(filter: Filter<UserDocument>, options?: FindOptions) {
    return client
      .db()
      .collection<UserDocument>(collectionName)
      .findOne(filter, options);
  }

  static async findChannel(id: string, currentUserId: string) {
    const channelId = new ObjectId(id);
    const userId = currentUserId ? new ObjectId(currentUserId) : '';

    const result = await client
      .db()
      .collection<WithId<Channel>>(collectionName)
      .aggregate([
        { $match: { _id: channelId } },
        {
          $project: {
            name: 1,
            picture: 1,
            subscribers: { $size: '$subscribers' },
            subscribes: { $size: '$subscribes' },
            isSubscribed: {
              $in: [userId, '$subscribers'],
            },
          },
        },
      ])
      .toArray();

    return result[0];
  }

  static async findHistory(
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
      .collection<UserDocument>(collectionName)
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

  static async findSubscribes(id: string) {
    const userId = new ObjectId(id);

    const result = await client
      .db()
      .collection<UserDocument>(collectionName)
      .aggregate([
        { $match: { _id: userId } },
        {
          $lookup: {
            from: 'users',
            as: 'subscribes',
            let: { subscribes: '$subscribes' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$subscribes'] } } },
              {
                $project: {
                  name: 1,
                  picture: 1,
                  subscribers: { $size: '$subscribers' },
                  subscribes: { $size: '$subscribes' },
                  isSubscribed: {
                    $in: [id ? userId : '', '$subscribers'],
                  },
                },
              },
            ],
          },
        },
        { $project: { subscribes: 1 } },
      ])
      .toArray();

    const { subscribes } = result[0];

    return subscribes;
  }

  static async findFavorites(id: string, page: number, max: number) {
    const userId = new ObjectId(id);

    const creatorPipeline = attachCreatorInfo();
    const historyPipeline = attachHistory(userId);

    const result = await client
      .db()
      .collection<UserDocument>(collectionName)
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

  static async createUser(
    type: 'native' | 'google',
    params: {
      name: string;
      email: string;
      password: string;
    }
  ) {
    let newUser = new UserSchema(
      type,
      params.name,
      params.email,
      params.password
    );

    if (type === 'native') {
      newUser.verificationToken = createToken({ type: 'verification' }, '1d');
    }

    if (type === 'google') {
      newUser.isVerified = true;
      newUser.password = uuidv1() + params.email;
    }

    newUser.password = await bcrypt.hash(newUser.password, 12);

    const { insertedId } = await client
      .db()
      .collection<UserDocument>(collectionName)
      .insertOne(newUser);

    const userDocument: UserDocument = {
      ...newUser,
      _id: insertedId,
    };

    return userDocument;
  }

  static async updateUser(
    id: string | ObjectId,
    update: UpdateFilter<UserDocument>
  ) {
    const userId = new ObjectId(id);
    const updateFilter = { ...update };

    if (updateFilter.$set && updateFilter.$set.password) {
      updateFilter.$set = {
        ...updateFilter.$set,
        password: await bcrypt.hash(updateFilter.$set.password, 12),
      };
    }

    return client
      .db()
      .collection<UserDocument>(collectionName)
      .updateOne({ _id: userId }, updateFilter);
  }

  static checkPassword(user: UserDocument, password: string) {
    return bcrypt.compare(password, user.password);
  }

  static async addToHistory(id: string, history: History) {
    const userId = new ObjectId(id);
    const newHistory = history;

    newHistory.video = new ObjectId(newHistory.video);
    newHistory.updatedAt = new Date(newHistory.updatedAt);

    const collection = client.db().collection<UserDocument>(collectionName);

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

  static async addToFavorites(targetId: string, currentUserId: string) {
    const videoId = new ObjectId(targetId);
    const userId = new ObjectId(currentUserId);

    const session = client.startSession();
    const videoCollection = client.db().collection<VideoDocument>('videos');
    const userCollection = client.db().collection<UserDocument>('users');

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
    const videoCollection = client.db().collection<VideoDocument>('videos');
    const userCollection = client.db().collection<UserDocument>('users');

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

  static async subscribe(targetId: string, currentUserId: string) {
    const subscribeId = new ObjectId(targetId);
    const subscriberId = new ObjectId(currentUserId);

    const session = client.startSession();
    const collection = client.db().collection<UserDocument>(collectionName);

    await session.withTransaction(async () => {
      await Promise.all([
        collection.updateOne(
          { _id: subscribeId },
          { $addToSet: { subscribers: subscriberId } }
        ),
        collection.updateOne(
          { _id: subscriberId },
          { $addToSet: { subscribes: subscribeId } }
        ),
      ]);
    });

    await session.endSession();
  }

  static async unsubscribe(targetId: string, currentUserId: string) {
    const subscribeId = new ObjectId(targetId);
    const subscriberId = new ObjectId(currentUserId);

    const session = client.startSession();
    const collection = client.db().collection<UserDocument>(collectionName);

    await session.withTransaction(async () => {
      await Promise.all([
        collection.updateOne(
          { _id: subscribeId },
          { $pull: { subscribers: subscriberId } }
        ),
        collection.updateOne(
          { _id: subscriberId },
          { $pull: { subscribes: subscribeId } }
        ),
      ]);
    });

    await session.endSession();
  }
}
