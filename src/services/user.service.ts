import { FilterQuery } from 'mongoose';

import { UserModel, User } from '../models/user';
import { HttpError } from '../models/error';
import { createToken } from '../util/jwt-token';

export const findById = (id: string) => {
  return UserModel.findById(id);
};

export const findOne = (filter: FilterQuery<User>) => {
  return UserModel.findOne(filter);
};

export const create = async (
  type: 'native' | 'google',
  name: string,
  email: string,
  password: string
) => {
  const user = new UserModel({ type, name, email, password });

  if (type === 'native') {
    user.verificationToken = createToken({ type: 'verification' }, '1d');
  }

  if (type === 'google') {
    user.isVerified = true;
  }

  return await user.save();
};

export const update = async (id: string, updates: Partial<User>) => {
  const user = await UserModel.findById(id);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  for (let key in updates) {
    (user as any)[key] = (updates as any)[key];
  }

  return await user.save();
};
