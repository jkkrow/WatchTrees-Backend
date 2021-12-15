import { Filter, FindOptions, UpdateFilter, WithId, ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { client } from '../../config/db';
import { User, Channel, History, UserSchema } from './User';
import { VideoDocument } from '../videos/VideoService';
import { createToken } from '../../services/jwt-token';

const collectionName = 'users';

export interface UserDocument extends WithId<User> {}

export class UserService {
  static findById(id: ObjectId | string, options?: FindOptions) {
    return client
      .db()
      .collection<UserDocument>(collectionName)
      .findOne({ _id: new ObjectId(id) }, options);
  }

  static findOne(filter: Filter<UserDocument>, options?: FindOptions) {
    return client
      .db()
      .collection<UserDocument>(collectionName)
      .findOne(filter, options);
  }

  static async findChannel(id: string, currentUserId: string) {
    const result = await client
      .db()
      .collection<WithId<Channel>>(collectionName)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $project: {
            name: 1,
            picture: 1,
            subscribers: { $size: '$subscribers' },
            subscribes: { $size: '$subscribes' },
            isSubscribed: {
              $in: [
                currentUserId ? new ObjectId(currentUserId) : '',
                '$subscribers',
              ],
            },
          },
        },
      ])
      .toArray();

    return result[0];
  }

  static async findHistory(id: string, page: number, max: number) {
    const result = await client
      .db()
      .collection<UserDocument>(collectionName)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $unwind: '$history' },
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
                $addFields: {
                  'data.favorites': { $size: '$data.favorites' },
                  history: {
                    progress: '$$history.progress',
                    updatedAt: '$$history.updatedAt',
                  },
                },
              },
            ],
          },
        },
        { $unwind: '$history' },
        { $group: { _id: '$_id', videos: { $push: '$history' } } },
      ])
      .toArray();

    const videos = result.length ? result[0].videos : [];

    return videos;
  }

  static async findSubscribes(id: string) {
    const result = await client
      .db()
      .collection<UserDocument>(collectionName)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
                    $in: [id ? new ObjectId(id) : '', '$subscribers'],
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
    const historyPipeline = [
      {
        $lookup: {
          from: 'users',
          as: 'history',
          let: { id: '$_id' },
          pipeline: [
            { $match: { _id: new ObjectId(id) } },
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
    ];

    const result = await client
      .db()
      .collection<UserDocument>(collectionName)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
                      $addFields: {
                        'data.favorites': { $size: '$data.favorites' },
                      },
                    },
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
    userId: ObjectId | string,
    update: UpdateFilter<UserDocument>
  ) {
    let updateFilter = { ...update };

    if (updateFilter.$set && updateFilter.$set.password) {
      updateFilter = {
        ...updateFilter,
        $set: {
          ...updateFilter.$set,
          password: await bcrypt.hash(updateFilter.$set.password, 12),
        },
      };
    }

    return client
      .db()
      .collection<UserDocument>(collectionName)
      .updateOne({ _id: new ObjectId(userId) }, updateFilter);
  }

  static checkPassword(user: UserDocument, password: string) {
    return bcrypt.compare(password, user.password);
  }

  static async subscribe(targetId: string, currentUserId: string) {
    const session = client.startSession();
    const collection = client.db().collection<UserDocument>(collectionName);

    await session.withTransaction(async () => {
      await collection.updateOne(
        { _id: new ObjectId(targetId) },
        { $addToSet: { subscribers: new ObjectId(currentUserId) } }
      );
      await collection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $addToSet: { subscribes: new ObjectId(targetId) } }
      );
    });

    await session.endSession();
  }

  static async unsubscribe(targetId: string, currentUserId: string) {
    const session = client.startSession();
    const collection = client.db().collection<UserDocument>(collectionName);

    await session.withTransaction(async () => {
      await collection.updateOne(
        { _id: new ObjectId(targetId) },
        { $pull: { subscribers: new ObjectId(currentUserId) } }
      );
      await collection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $pull: { subscribes: new ObjectId(targetId) } }
      );
    });

    await session.endSession();
  }

  static async addToHistory(userId: string, history: History) {
    const collection = client.db().collection<UserDocument>(collectionName);

    history.video = new ObjectId(history.video);
    history.updatedAt = new Date(history.updatedAt);

    const result = await collection.updateOne(
      {
        _id: new ObjectId(userId),
        'history.video': history.video,
      },
      { $set: { 'history.$': history } }
    );

    if (!result.modifiedCount) {
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { history } }
      );
    }
  }

  static async addToFavorites(targetId: string, currentUserId: string) {
    const session = client.startSession();
    const videoCollection = client.db().collection<VideoDocument>('videos');
    const userCollection = client.db().collection<UserDocument>('users');

    await session.withTransaction(async () => {
      await Promise.all([
        videoCollection.updateOne(
          { _id: new ObjectId(targetId) },
          { $addToSet: { 'data.favorites': new ObjectId(currentUserId) } }
        ),
        userCollection.updateOne(
          { _id: new ObjectId(currentUserId) },
          { $addToSet: { favorites: new ObjectId(targetId) } }
        ),
      ]);
    });

    await session.endSession();
  }

  static async removeFromFavorites(targetId: string, currentUserId: string) {
    const session = client.startSession();
    const videoCollection = client.db().collection<VideoDocument>('videos');
    const userCollection = client.db().collection<UserDocument>('users');

    await session.withTransaction(async () => {
      await Promise.all([
        videoCollection.updateOne(
          { _id: new ObjectId(targetId) },
          { $pull: { 'data.favorites': new ObjectId(currentUserId) } }
        ),
        userCollection.updateOne(
          { _id: new ObjectId(currentUserId) },
          { $pull: { favorites: new ObjectId(targetId) } }
        ),
      ]);
    });

    await session.endSession();
  }
}
