import { Filter, FindOptions, UpdateFilter, WithId, ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { client } from '../../config/db';
import { User } from './User';
import { createToken } from '../../services/jwt-token';

const collectionName = 'users';

interface UserParams {
  name: string;
  email: string;
  password: string;
}

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

  static async createUser(type: 'native' | 'google', params: UserParams) {
    let newUser: User = {
      type: type,
      name: params.name,
      email: params.email,
      password: params.password,
      isVerified: false,
      isPremium: false,
      isAdmin: false,
      history: [],
      createdAt: new Date(),
    };

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

  static async checkPassword(user: UserDocument, password: string) {
    return await bcrypt.compare(user.password, password);
  }
}
