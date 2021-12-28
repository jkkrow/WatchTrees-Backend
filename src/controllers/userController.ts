import { RequestHandler } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { validationResult } from 'express-validator';
import { S3 } from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
import { parse } from 'path';

import { HttpError } from '../models/error/HttpError';
import { UserService, UserDocument } from '../models/users/UserService';
import {
  createToken,
  createAuthTokens,
  verifyToken,
} from '../services/jwt-token';
import { sendEmail } from '../services/send-email';

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

    const existingEmail = await UserService.findOne({ email });

    if (existingEmail) {
      throw new HttpError(409, 'Already existing email.');
    }

    const user = await UserService.createUser('native', {
      name,
      email,
      password,
    });

    await sendEmail({
      to: user.email,
      subject: 'Account verification link',
      message: `
      <h3>Verify your email address</h3>
      <p>You've just created new account with this email address.</p>
      <p>Please verify your email and complete signup process.</p>
      <a href=${process.env.CLIENT_URL}/auth/verification/${user.verificationToken}>Verify email</a>
      `,
    });

    const { refreshToken, accessToken } = createAuthTokens(user);
    const userData = UserService.getUserData(user);

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

    let user: UserDocument | null;

    if (!tokenId) {
      // Native login //

      user = await UserService.findOne({ email });

      if (!user || user.type !== 'native') {
        throw new HttpError(401, 'Invalid email or password.');
      }

      const correctPassword = await UserService.checkPassword(user, password);

      if (!correctPassword) {
        throw new HttpError(401, 'Invalid email or password.');
      }
    } else {
      // Google login //

      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const result = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { email_verified, email, name } = result.getPayload()!;

      if (!email_verified) {
        throw new HttpError(401, 'Google account not verified.');
      }

      user = await UserService.findOne({ email });

      if (!user) {
        user = await UserService.createUser('google', {
          email: email as string,
          name: name as string,
          password: '',
        });

        res.status(201);
      }

      if (user.type !== 'google') {
        throw new HttpError(401, 'Invalid Google account.');
      }
    }

    const { refreshToken, accessToken } = createAuthTokens(user);
    const userData = UserService.getUserData(user);

    res.json({ accessToken, refreshToken, userData });
  } catch (err) {
    return next(err);
  }
};

export const updateRefreshToken: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { refreshToken, accessToken } = createAuthTokens(req.user);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    return next(err);
  }
};

export const updateAccessToken: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { accessToken } = createAuthTokens(req.user);

    res.json({ accessToken });
  } catch (err) {
    return next(err);
  }
};

export const sendVerification: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await UserService.findOne({ email });

    if (!user) {
      throw new HttpError(
        404,
        'No user found with this email. Please sign up.'
      );
    }

    if (user.isVerified) {
      return res.json({ message: 'You have already been verified' });
    }

    const verificationToken = createToken({ type: 'verification' }, '1d');

    await UserService.updateUser(user._id, {
      $set: { verificationToken },
    });

    await sendEmail({
      to: user.email,
      subject: 'Account verification link',
      message: `
      <h3>Verify your email address</h3>
      <p>You've just created new account with this email address.</p>
      <p>Please verify your email and complete signup process.</p>
      <a href=${process.env.CLIENT_URL}/auth/verification/${verificationToken}>Verify email</a>
      `,
    });

    res.json({
      message:
        'Verification email has sent. Please check your email and confirm signup.',
    });
  } catch (err) {
    return next(err);
  }
};

export const checkVerification: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { isLoggedIn } = req.query;

    const user = await UserService.findOne({ verificationToken: token });

    if (!user) {
      throw new HttpError(404);
    }

    if (user.isVerified) {
      return res.json({ message: "You've already been verified." });
    }

    verifyToken(
      token,
      'This verification link has expired. Please send another email from Account Settings page.'
    );

    await UserService.updateUser(user._id, {
      $set: { isVerified: true },
    });

    user.isVerified = true;

    const message = 'Your account has been successfully verified.';

    if (isLoggedIn === 'true') {
      const { refreshToken, accessToken } = createAuthTokens(user);
      const userData = UserService.getUserData(user);

      return res.json({ message, refreshToken, accessToken, userData });
    }

    res.json({ message });
  } catch (err) {
    return next(err);
  }
};

export const sendRecovery: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await UserService.findOne({ email });

    if (!user) {
      throw new HttpError(
        404,
        'No user found with this email. Please sign up.'
      );
    }

    const recoveryToken = createToken({ type: 'recovery' }, '1h');

    await UserService.updateUser(user._id, { $set: { recoveryToken } });

    await sendEmail({
      to: user.email,
      subject: 'Reset password link',
      message: `
      <h3>Reset your password.</h3>
      <p>You've just requested the reset of the password for your account.</p>
      <p>Please click the following link to complete the process within one hour.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <a href=${process.env.CLIENT_URL}/auth/reset-password/${recoveryToken}>Reset Password</a>
      `,
    });

    res.json({ message: 'Recovery email has sent successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const checkRecovery: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await UserService.findOne({ recoveryToken: token });

    if (!user) {
      throw new HttpError(404);
    }

    verifyToken(
      token,
      'This link has been expired. Please send another email to reset password.'
    );

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

    const user = await UserService.findOne({ recoveryToken: token });

    if (!user) {
      throw new HttpError(404);
    }

    await UserService.updateUser(user._id, {
      $set: { password },
      $unset: { recoveryToken: '' },
    });

    res.json({ message: 'Password has changed successfully.' });
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

    await UserService.updateUser(req.user.id, { $set: { name } });

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

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404);
    }

    const correctPassword = await UserService.checkPassword(
      user,
      currentPassword
    );

    if (!correctPassword) {
      throw new HttpError(422, 'Invalid password.');
    }

    await UserService.updateUser(req.user.id, {
      $set: { password: newPassword },
    });

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

      await UserService.updateUser(req.user.id, {
        $set: { picture: params.Key },
      });

      newPicture = params.Key;
    }

    if (!isNewFile && user.picture) {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture,
      };

      await s3.deleteObject(params).promise();

      await UserService.updateUser(req.user.id, {
        $set: { picture: '' },
      });
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
