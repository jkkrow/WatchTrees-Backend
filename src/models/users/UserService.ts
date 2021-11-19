import { InsertOneResult, UpdateResult, WithId, FindOptions } from 'mongodb';

import { User } from './User';
import { db } from '../../config/db';

const collectionName = 'users';

export interface UserDocument {
  findById(id: string, options?: FindOptions): Promise<WithId<User> | null>;
  save(user: User): Promise<InsertOneResult<User>>;
  update(user: User): Promise<UpdateResult>;
}

export class UserModel implements UserDocument {
  findById(id: string, options: FindOptions) {
    return db.collection<User>(collectionName).findOne({ _id: id }, options);
  }

  save(user: User) {
    return db.collection<User>(collectionName).insertOne(user);
  }

  update(user: User) {
    return db.collection<User>(collectionName).updateOne({}, {});
  }
}
