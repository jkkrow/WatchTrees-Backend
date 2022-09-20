import { validationResult } from 'express-validator';

import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';
import * as ChannelService from '../services/channel.service';
import * as VideoTreeService from '../services/video-tree.service';
import * as UploadService from '../services/upload.service';
import * as HistoryService from '../services/history.service';
import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';
import { createToken } from '../util/jwt';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs.');
  }

  const user = await AuthService.signup(name, email, password);

  const refreshToken = createToken(user.id, 'refresh', '7d');
  const accessToken = createToken(user.id, 'access', '15m');
  const userData = {
    _id: user._id,
    type: user.type,
    name: user.name,
    email: user.email,
    picture: user.picture,
    isVerified: user.isVerified,
    premium: user.premium,
  };

  res.status(201).json({
    message:
      'Verification email has been sent. Please check your email and confirm signup.',
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

  const refreshToken = createToken(user.id, 'refresh', '7d');
  const accessToken = createToken(user.id, 'access', '15m');
  const userData = {
    _id: user.id,
    type: user.type,
    name: user.name,
    email: user.email,
    picture: user.picture,
    isVerified: user.isVerified,
    premium: user.premium,
  };

  res.json({ accessToken, refreshToken, userData });
});

export const getUserData = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const user = await UserService.findById(req.user.id);
  const userData = {
    _id: user.id,
    type: user.type,
    name: user.name,
    email: user.email,
    picture: user.picture,
    isVerified: user.isVerified,
    premium: user.premium,
  };

  res.json({ userData });
});

export const getRefreshToken = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const refreshToken = createToken(req.user.id, 'refresh', '7d');
  const accessToken = createToken(req.user.id, 'access', '15m');

  res.json({ accessToken, refreshToken });
});

export const getAccessToken = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const accessToken = createToken(req.user.id, 'access', '15m');

  res.json({ accessToken });
});

export const sendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await AuthService.sendVerification(email);

  res.json({
    message:
      'Verification email has been sent. Please check your email and confirm signup',
  });
});

export const checkVerification = asyncHandler(async (req, res) => {
  const { token } = req.params;

  await AuthService.checkVerification(token);

  res.json({ message: 'Your account has been successfully verified' });
});

export const sendRecovery = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await AuthService.sendRecovery(email);

  res.json({ message: 'Recovery email has been sent successfully' });
});

export const checkRecovery = asyncHandler(async (req, res) => {
  const { token } = req.params;

  await AuthService.checkRecovery(token);

  res.json({ message: 'Verified token successfully' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs');
  }

  const userId = await AuthService.checkRecovery(token);
  await AuthService.resetPassword(userId, password);

  res.json({ message: 'Password has changed successfully' });
});

export const getPremiumData = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const user = await UserService.findById(req.user.id);

  res.json({ premium: user.premium });
});

export const updateUserName = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { name } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs');
  }

  await UserService.update(req.user.id, { name });

  res.json({ message: 'User name updated successfully' });
});

export const updatePassword = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { currentPassword, newPassword } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError(422, 'Invalid inputs');
  }

  await AuthService.updatePassword(req.user.id, currentPassword, newPassword);

  res.json({ message: 'Password updated successfully' });
});

export const updatePicture = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { picture } = req.body;

  await UserService.update(req.user.id, { picture });

  res.json({ message: 'Profile picture updated successfully' });
});

export const getChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const params = req.query as { userId: string };

  const channel = await ChannelService.findById({ id, ...params });

  if (!channel) {
    throw new HttpError(404, 'No Channel found');
  }

  res.json({ channel });
});

export const getSubscribes = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const params = req.query as {
    page: string;
    max: string;
  };

  const { channels, count } = await ChannelService.findBySubscribes({
    userId: req.user.id,
    ...params,
  });

  res.json({ channels, count });
});

export const getSubscribers = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const params = req.query as {
    page: string;
    max: string;
  };

  const { channels, count } = await ChannelService.findBySubscribers({
    userId: req.user.id,
    ...params,
  });

  res.json({ channels, count });
});

export const updateSubscribers = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await ChannelService.updateSubscribers(id, req.user.id);

  res.json({ message: 'Subscribes updated' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { email, password, tokenId } = req.body;

  if (tokenId) {
    await AuthService.verifyGoogleAccount(req.user.id, tokenId);
  } else {
    await AuthService.verifyNativeAccount(req.user.id, email, password);
  }

  await UserService.remove(req.user.id);

  // Delete user created contents

  const videoPath = `videos/${req.user.id}/`;
  const imagePath = `images/${req.user.id}/`;

  await Promise.all([
    VideoTreeService.deleteByCreator(req.user.id),
    HistoryService.deleteByUser(req.user.id),
    UploadService.deleteDirectory(videoPath),
    UploadService.deleteDirectory(imagePath),
  ]);

  res.json({ message: 'Deleted account successfully' });
});
