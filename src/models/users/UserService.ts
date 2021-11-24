import { Filter, FindOptions, UpdateFilter, WithId, ObjectId } from 'mongodb';
import { v1 as uuidv1 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { db } from '../../config/db';
import { User } from './User';
import { createToken } from '../../services/jwt-token';

const collectionName = 'users';

interface NativeUserParams {
  name: string;
  email: string;
  password: string;
}

interface GoogleUserParams {
  name: string;
  email: string;
}

export interface UserDocument extends WithId<User> {}

export class UserService {
  static findById(id: ObjectId | string, options?: FindOptions) {
    return db
      .collection<UserDocument>(collectionName)
      .findOne({ _id: new ObjectId(id) }, options);
  }

  static findOne(filter: Filter<UserDocument>, options?: FindOptions) {
    return db.collection<UserDocument>(collectionName).findOne(filter, options);
  }

  static async createUser(
    type: 'native' | 'google',
    params: NativeUserParams | GoogleUserParams
  ) {
    let newUser: any = {};

    newUser = { ...params };
    newUser.isVerified = false;
    newUser.isPremium = false;
    newUser.isAdmin = false;

    if (type === 'native') {
      newUser.verificationToken = createToken('verification', '1d');
    }

    if (type === 'google') {
      newUser.isVerified = true;
      newUser.password = uuidv1() + params.email;
    }

    newUser.password = await bcrypt.hash(newUser.password, 12);

    const { insertedId } = await db
      .collection<UserDocument>(collectionName)
      .insertOne(newUser);

    newUser._id = insertedId;

    return newUser as UserDocument;
  }

  static updateUser(
    userId: ObjectId | string,
    update: UpdateFilter<User> | Partial<User>
  ) {
    return db
      .collection<UserDocument>(collectionName)
      .updateOne({ _id: new ObjectId(userId) }, update);
  }

  static async updatePassword(userId: ObjectId | string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 12);

    return db
      .collection<UserDocument>(collectionName)
      .updateOne({ _id: new ObjectId(userId) }, { password: hashedPassword });
  }

  static async checkPassword(user: UserDocument, password: string) {
    return await bcrypt.compare(user.password, password);
  }
}
