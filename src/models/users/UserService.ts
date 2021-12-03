import { Filter, FindOptions, UpdateFilter, WithId, ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { client } from '../../config/db';
import { User, UserSchema } from './User';
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

  static checkPassword(user: UserDocument, password: string) {
    return bcrypt.compare(password, user.password);
  }
}
