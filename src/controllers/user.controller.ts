import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { S3 } from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
import { parse } from 'path';

import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';
import { HttpError } from '../models/error';
import { createAuthTokens } from '../util/jwt-token';

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_BUCKET_REGION!,
});

export const register: RequestHandler = async (req, res, next) => {
  try {
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
  } catch (err) {
    return next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
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

    res
      .status(tokenId ? 201 : 200)
      .json({ accessToken, refreshToken, userData });
  } catch (err) {
    return next(err);
  }
};

export const updateRefreshToken: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { refreshToken, accessToken } = createAuthTokens(req.user.id);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    return next(err);
  }
};

export const updateAccessToken: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { accessToken } = createAuthTokens(req.user.id);

    res.json({ accessToken });
  } catch (err) {
    return next(err);
  }
};

export const sendVerification: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    const message = await AuthService.sendVerification(email);

    res.json({ message });
  } catch (err) {
    return next(err);
  }
};

export const checkVerification: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.params;

    const message = await AuthService.checkVerification(token);

    res.json({ message });
  } catch (err) {
    return next(err);
  }
};

export const sendRecovery: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    const message = await AuthService.sendRecovery(email);

    res.json({ message });
  } catch (err) {
    return next(err);
  }
};

export const checkRecovery: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.params;

    await AuthService.checkRecovery(token);

    res.json();
  } catch (err) {
    return next(err);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    const message = await AuthService.resetPassword(token, password);

    res.json({ message });
  } catch (err) {
    return next(err);
  }
};

export const updateUserName: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { name } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    await UserService.update(req.user.id, { name });

    res.json({ message: 'User name updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { currentPassword, newPassword } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    await UserService.updatePassword(req.user.id, currentPassword, newPassword);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const updatePicture: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { isNewFile, fileType } = req.body;

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404);
    }

    let presignedUrl = '';
    let newPicture = '';

    if (isNewFile) {
      const { dir, name } = parse(fileType);

      if (dir !== 'image') {
        throw new HttpError(422, 'Invalid file type');
      }

      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture || `images/${req.user.id}/${uuidv1()}.${name}`,
        ContentType: fileType,
      };

      presignedUrl = await s3.getSignedUrlPromise('putObject', params);

      await UserService.update(req.user.id, { picture: params.Key });

      newPicture = params.Key;
    }

    if (!isNewFile && user.picture) {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture,
      };

      await s3.deleteObject(params).promise();

      await UserService.update(req.user.id, { picture: '' });
    }

    res.json({
      presignedUrl,
      newPicture,
      message: 'Picture updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
};

export const fetchChannelInfo: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query as { [key: string]: string };

    const channelInfo = await UserService.getChannelInfo(id, currentUserId);

    if (!channelInfo) {
      throw new HttpError(404, 'No Channel found');
    }

    res.json({ channelInfo });
  } catch (err) {
    return next(err);
  }
};

export const fetchSubscribes: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const subscribes = await UserService.getSubscribes(req.user.id);

    res.json({ subscribes });
  } catch (err) {
    return next(err);
  }
};

export const updateSubscribes: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const channelInfo = await UserService.getChannelInfo(id, req.user.id);

    if (!channelInfo) {
      throw new HttpError(404, 'No Channel found');
    }

    if (channelInfo.isSubscribed) {
      await UserService.unsubscribe(id, req.user.id);
      channelInfo.subscribers--;
    } else {
      await UserService.subscribe(id, req.user.id);
      channelInfo.subscribers++;
    }

    res.json({
      isSubscribed: !channelInfo.isSubscribed,
      subscribers: channelInfo.subscribers,
    });
  } catch (err) {
    return next(err);
  }
};
