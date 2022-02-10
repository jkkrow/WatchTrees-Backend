import { FilterQuery } from 'mongoose';
import * as bcrypt from 'bcryptjs';

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

export const updatePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await UserModel.findById(id);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new HttpError(401, 'Invalid password');
  }

  const hash = await bcrypt.hash(newPassword, 12);

  user.password = hash;

  await user.save();
};
