import { RequestHandler } from 'express';

import * as UserService from '../services/user.service';
import { HttpError } from '../models/error';
import { verifyToken } from '../util/jwt-token';

export const checkToken: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new HttpError(403);
    }

    const token = authorization.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (decodedToken.type !== 'access') {
      throw new HttpError(403, 'Require access token');
    }

    req.user = { id: decodedToken.userId };

    next();
  } catch (err) {
    return next(err);
  }
};

export const checkVerified: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError(403);
    }

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    if (!user.isVerified) {
      throw new HttpError(403, 'Account need to be verified for this job');
    }

    next();
  } catch (err) {
    return next(err);
  }
};

// export const checKPremium: RequestHandler = (req, res, next) => {};
