import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';

import * as UserService from './user.service';
import { HttpError } from '../models/error';
import { createToken, verifyToken } from '../util/jwt';
import { sendEmail } from '../util/send-email';

export const signup = async (name: string, email: string, password: string) => {
  const existingEmail = await UserService.findOne({ email });

  if (existingEmail) {
    throw new HttpError(409, 'Already existing email.');
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await UserService.create('native', name, email, hash);
  const verificationToken = createToken(user.id, 'verification', '1d');

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
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const result = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
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
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const result = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = result.getPayload();

  if (!payload || payload.email !== user.email) {
    throw new HttpError(401, 'Invalid account email');
  }

  return user;
};

export const deleteAccount = async (id: string) => {
  // Delete user
  const user = await UserService.remove(id);

  // Send email to inform that account has been deleted
  await sendEmail({
    to: user.email,
    subject: 'Account deleted',
    message: `
      <h3>Your account has been deleted successfully</h3>
      <p>Your account and created contents will no longer be available.</p>
      <p>Also, you will no longer receive email from our services.</p>
      <p>Thank you for using our services.</p>
      `,
  });

  return user;
};
