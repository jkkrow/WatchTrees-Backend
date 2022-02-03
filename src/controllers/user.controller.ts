import { validationResult } from 'express-validator';

import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';
import * as UploadService from '../services/upload.service';
import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';
import { createAuthTokens } from '../util/jwt-token';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs.');
  }

  const user = await AuthService.signup(name, email, password);

  const { refreshToken, accessToken } = createAuthTokens(user.id);
  const userData = {
    _id: user._id,
    type: user.type,
    name: user.name,
    email: user.email,
    picture: user.picture,
    isVerified: user.isVerified,
    isPremium: user.isPremium,
  };

  res.status(201).json({
    message:
      'Verification email has sent. Please check your email and confirm signup.',
    accessToken,
    refreshToken,
    userData,
  });
});

export const signin = asyncHandler(async (req, res) => {
  const { email, password, tokenId } = req.body;

  const user = tokenId
    ? await AuthService.googleSignin(tokenId)
    : await AuthService.signin(email, password);

  const { refreshToken, accessToken } = createAuthTokens(user.id);
  const userData = {
    _id: user.id,
    type: user.type,
    name: user.name,
    email: user.email,
    picture: user.picture,
    isVerified: user.isVerified,
    isPremium: user.isPremium,
  };

  res.status(tokenId ? 201 : 200).json({ accessToken, refreshToken, userData });
});

export const updateRefreshToken = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { refreshToken, accessToken } = createAuthTokens(req.user.id);

  res.json({ accessToken, refreshToken });
});

export const updateAccessToken = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { accessToken } = createAuthTokens(req.user.id);

  res.json({ accessToken });
});

export const sendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const message = await AuthService.sendVerification(email);

  res.json({ message });
});

export const checkVerification = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const message = await AuthService.checkVerification(token);

  res.json({ message });
});

export const sendRecovery = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const message = await AuthService.sendRecovery(email);

  res.json({ message });
});

export const checkRecovery = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const message = await AuthService.checkRecovery(token);

  res.json({ message });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs.');
  }

  const message = await AuthService.resetPassword(token, password);

  res.json({ message });
});

export const updateUserName = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { name } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs.');
  }

  await UserService.update(req.user.id, { name });

  res.json({ message: 'User name updated successfully.' });
});

export const updatePassword = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { currentPassword, newPassword } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs.');
  }

  await UserService.updatePassword(req.user.id, currentPassword, newPassword);

  res.json({ message: 'Password updated successfully.' });
});

export const updatePicture = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { isNewFile, fileType } = req.body;

  let url = '';
  let path = '';

  const user = await UserService.findById(req.user.id);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (isNewFile) {
    const { presignedUrl, key } = await UploadService.uploadImage(
      fileType,
      user.picture
    );

    url = presignedUrl;
    path = key;
  } else {
    user.picture && (await UploadService.deleteImage(user.picture));
    path = '';
  }

  await UserService.update(req.user.id, { picture: path });

  res.json({
    presignedUrl: url,
    picture: path,
    message: 'Picture updated successfully.',
  });
});

export const getChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentUserId } = req.query as { [key: string]: string };

  const channelInfo = await UserService.findChannelById(id, currentUserId);

  if (!channelInfo) {
    throw new HttpError(404, 'No Channel found');
  }

  res.json({ channelInfo });
});

export const getSubscribes = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const subscribes = await UserService.findChannelBySubscribes(req.user.id);

  res.json({ subscribes });
});

export const updateSubscribers = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await UserService.updateSubscribers(id, req.user.id);

  res.json({ message: 'Subscribes updated' });
});
