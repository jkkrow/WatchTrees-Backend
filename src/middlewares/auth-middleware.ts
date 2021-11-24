import { RequestHandler } from 'express';

import HttpError from '../models/Error/HttpError';
import { verifyToken } from '../services/jwt-token';

export const checkToken: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new HttpError(403);
    }

    const token = authorization.split(' ')[1];

    const decodedToken = verifyToken(token);

    req.user = {
      id: decodedToken.userId,
      isVerified: decodedToken.isVerified,
      isPremium: decodedToken.isPremium,
    };

    next();
  } catch (err) {
    return next(err);
  }
};

export const checkVerified: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (req.user && req.user.isVerified) {
    next();
  } else {
    return next(new HttpError(403, 'Need to verify email'));
  }
};

// export const checKPremium: RequestHandler = (req, res, next) => {};
