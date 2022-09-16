import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';
import { AWS_EVENTBRIDGE_API_KEY } from '../config/env';

export const verifyEventHeaders = asyncHandler((req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const { secret } = req.headers;

  if (!secret || secret !== AWS_EVENTBRIDGE_API_KEY) {
    throw new HttpError(403);
  }

  next();
});
