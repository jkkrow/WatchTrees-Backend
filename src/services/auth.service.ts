import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';

import * as UserService from './user.service';
import * as EmailService from './email.service';
import { HttpError } from '../models/error';
import { createToken, verifyToken } from '../util/jwt';
import { CLIENT_URL, GOOGLE_CLIENT_ID } from '../config/env';

export const signup = async (name: string, email: string, password: string) => {
  const existingEmail = await UserService.findOne({ email });

  if (existingEmail) {
    throw new HttpError(409, 'Already existing email.');
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await UserService.create('native', name, email, hash);

  return user;
};

export const signin = async (email: string, password: string) => {
  const user = await UserService.findOne({ email });

  if (!user || user.type !== 'native') {
    throw new HttpError(401, 'Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return user;
};

export const googleSignin = async (tokenId: string) => {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);

  const result = await client.verifyIdToken({
    idToken: tokenId,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = result.getPayload();

  if (!payload || !payload.email_verified) {
    throw new HttpError(401, 'Google account not verified');
  }

  let user = await UserService.findOne({ email: payload.email });

  if (user && user.type !== 'google') {
    throw new HttpError(409, 'Account already exists for this email');
  }

  const hash = await bcrypt.hash(uuidv4() + payload.email, 12);

  if (!user) {
    user = await UserService.create(
      'google',
      payload.name!,
      payload.email!,
      hash
    );
  }

  return user;
};

export const updatePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await UserService.findById(id);

  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new HttpError(401, 'Invalid password');
  }

  const hash = await bcrypt.hash(newPassword, 12);

  return await UserService.update(user.id, { password: hash });
};

export const sendVerification = async (email: string) => {
  const user = await UserService.findOne({ email });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.isVerified) {
    throw new HttpError(400, 'You have already been verified');
  }

  const verificationToken = createToken(user.id, 'verification', '1d');

  await EmailService.sendEmailWithTemplate({
    from: 'auth',
    to: user.email,
    templateAlias: 'account-verification',
    templateModel: {
      action_url: `${CLIENT_URL}/auth/verification/${verificationToken}`,
      retry_url: `${CLIENT_URL}/user/account`,
    },
  });

  return verificationToken;
};

export const checkVerification = async (token: string) => {
  const decodedToken = verifyToken(
    token,
    'verification',
    'This verification link is either invalid or expired. Please send another email from Account page.'
  );

  const user = await UserService.findById(decodedToken.userId);

  if (user.isVerified) {
    throw new HttpError(400, "You've already been verified");
  }

  return await UserService.update(user.id, { isVerified: true });
};

export const sendRecovery = async (email: string) => {
  const user = await UserService.findOne({ email });

  if (!user) {
    throw new HttpError(404, 'No user found with this email. Please sign up');
  }

  const recoveryToken = createToken(user.id, 'recovery', '1h');

  await EmailService.sendEmailWithTemplate({
    from: 'auth',
    to: user.email,
    templateAlias: 'password-reset',
    templateModel: {
      action_url: `${CLIENT_URL}/auth/reset-password/${recoveryToken}`,
      retry_url: `${CLIENT_URL}/auth/recovery`,
    },
  });

  return recoveryToken;
};

export const checkRecovery = async (token: string) => {
  const decodedToken = verifyToken(
    token,
    'recovery',
    'This recovery link is either invalid or expired. Please send another email to reset password.'
  );

  return decodedToken.userId;
};

export const resetPassword = async (userId: string, password: string) => {
  const user = await UserService.findById(userId);
  const hash = await bcrypt.hash(password, 12);

  return await UserService.update(user.id, { password: hash });
};

export const verifyNativeAccount = async (
  id: string,
  email: string,
  password: string
) => {
  const user = await UserService.findById(id);

  if (user.email !== email) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return user;
};

export const verifyGoogleAccount = async (id: string, tokenId: string) => {
  const user = await UserService.findById(id);
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);

  const result = await client.verifyIdToken({
    idToken: tokenId,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = result.getPayload();

  if (!payload || payload.email !== user.email) {
    throw new HttpError(401, 'Invalid account email');
  }

  return user;
};
