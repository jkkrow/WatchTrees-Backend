import { RequestHandler } from 'express';

import HttpError from '../models/common/HttpError';
import { verifyToken } from '../services/jwt-token';

const authMiddleware: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new HttpError(403);
    }

    const token = authorization.split(' ')[1];

    const decodedToken = verifyToken(token);

    req.user = { id: decodedToken.userId };

    next();
  } catch (err) {
    return next(err);
  }
};

export default authMiddleware;
