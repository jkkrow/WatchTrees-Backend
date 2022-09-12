import * as UserService from '../services/user.service';
import { HttpError } from '../models/error';
import { verifyToken } from '../util/jwt';
import { asyncHandler } from '../util/async-handler';

export const checkAccessToken = asyncHandler((req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const { authorization } = req.headers;

  if (!authorization) {
    throw new HttpError(403);
  }

  const token = authorization.split(' ')[1];
  const decodedToken = verifyToken(token, 'access');

  req.user = { id: decodedToken.userId };

  next();
});

export const checkRefreshToken = asyncHandler(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const { authorization } = req.headers;

  if (!authorization) {
    throw new HttpError(403);
  }

  const token = authorization.split(' ')[1];
  const decodedToken = verifyToken(token, 'refresh');

  req.user = { id: decodedToken.userId };

  next();
});

export const checkVerified = asyncHandler(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (!req.user) {
    throw new HttpError(403);
  }

  const user = await UserService.findById(req.user.id);

  if (!user.isVerified) {
    throw new HttpError(403, 'Account needs to be verified for this job');
  }

  next();
});

export const checKPremium = asyncHandler(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (!req.user) {
    throw new HttpError(403);
  }

  const user = await UserService.findById(req.user.id);
  const isPremium =
    user.isVerified &&
    user.premium &&
    new Date(user.premium.expiredAt) > new Date();

  if (!isPremium) {
    throw new HttpError(403, 'Only premium users are allowed for this job');
  }

  next();
});
