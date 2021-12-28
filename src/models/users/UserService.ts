import { Filter, FindOptions, UpdateFilter, WithId, ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { client } from '../../config/db';
import { User, Channel, UserSchema } from './User';
import { createToken } from '../../services/jwt-token';

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

  static async getChannelInfo(id: string, currentUserId: string) {
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

  static async getSubscribes(id: string) {
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

  static getUserData(user: UserDocument) {
    return {
      _id: user._id,
      type: user.type,
      name: user.name,
      email: user.email,
      picture: user.picture,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
    };
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
