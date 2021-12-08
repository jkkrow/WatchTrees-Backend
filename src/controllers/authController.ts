import { RequestHandler } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { validationResult } from 'express-validator';

import { HttpError } from '../models/error/HttpError';
import { UserDocument, UserService } from '../models/users/UserService';
import {
  createAccessToken,
  createRefreshToken,
  createToken,
  verifyToken,
} from '../services/jwt-token';
import sendEmail from '../services/send-email';

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

    const accessToken = createAccessToken({
      userId: user._id.toString(),
      isVerified: user.isVerified,
      isPremium: user.isPremium,
    });
    const refreshToken = createRefreshToken({
      userId: user._id.toString(),
      isVerified: user.isVerified,
      isPremium: user.isPremium,
    });

    res.status(201).json({
      message:
        'Verification email has sent. Please check your email and confirm signup.',
      accessToken,
      refreshToken,
      userData: {
        _id: user._id,
        type: user.type,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isVerified: user.isVerified,
        isPremium: user.isPremium,
      },
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

    const accessToken = createAccessToken({
      userId: user._id.toString(),
      isVerified: user.isVerified,
      isPremium: user.isPremium,
    });
    const refreshToken = createRefreshToken({
      userId: user._id.toString(),
      isVerified: user.isVerified,
      isPremium: user.isPremium,
    });

    res.json({
      accessToken,
      refreshToken,
      userData: {
        _id: user._id,
        type: user.type,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isVerified: user.isVerified,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const updateRefreshToken: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const newAccessToken = createAccessToken({
      userId: req.user.id,
      isVerified: req.user.isVerified,
      isPremium: req.user.isPremium,
    });

    const newRefreshToken = createRefreshToken({
      userId: req.user.id,
      isVerified: req.user.isVerified,
      isPremium: req.user.isPremium,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return next(err);
  }
};

export const updateAccessToken: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const newAccessToken = createAccessToken({
      userId: req.user.id,
      isVerified: req.user.isVerified,
      isPremium: req.user.isPremium,
    });

    res.json({ accessToken: newAccessToken });
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

    try {
      verifyToken(token);
    } catch (err) {
      return next(
        new HttpError(
          401,
          'This verification link has expired. Please send another email from Account Settings page.'
        )
      );
    }

    await UserService.updateUser(user._id, {
      $set: { isVerified: true },
    });

    const message = 'Your account has been successfully verified.';

    if (isLoggedIn === 'true') {
      const refreshToken = createRefreshToken({
        userId: user._id.toString(),
        isVerified: true,
        isPremium: user.isPremium,
      });
      const accessToken = createAccessToken({
        userId: user._id.toString(),
        isVerified: true,
        isPremium: user.isPremium,
      });
      const userData = {
        _id: user._id,
        type: user.type,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isVerified: true,
        isPremium: user.isPremium,
      };

      return res.json({
        message,
        refreshToken,
        accessToken,
        userData,
      });
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

    try {
      verifyToken(token);
    } catch (err) {
      return next(
        new HttpError(
          401,
          'This link has been expired. Please send another email to reset password.'
        )
      );
    }

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

    try {
      verifyToken(token);
    } catch (err) {
      return next(
        new HttpError(
          401,
          'This link has been expired. Please send another email to reset password.'
        )
      );
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
