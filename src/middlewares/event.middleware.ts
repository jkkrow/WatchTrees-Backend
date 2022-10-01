import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';
import { APPLICATION_NAME } from '../config/env';

export const checkApiKeyAuthentication = (apiKey: string) =>
  asyncHandler((req, _, next) => {
    if (req.method === 'OPTIONS') return next();

    const { secret } = req.headers;

    if (!secret || secret !== apiKey) {
      throw new HttpError(401, 'Invalid auth credentials');
    }

    next();
  });

export const checkBasicAuthentication = (username: string, password: string) =>
  asyncHandler((req, _, next) => {
    if (req.method === 'OPTIONS') return next();

    const { authorization } = req.headers;

    if (!authorization) {
      throw new HttpError(401);
    }

    const hash = authorization.split(' ')[1];
    const [decodedUsername, decodedPassword] = Buffer.from(hash, 'base64')
      .toString('utf-8')
      .split(':');

    if (username !== decodedUsername || password !== decodedPassword) {
      throw new HttpError(401, 'Invalid auth credentials');
    }

    next();
  });

export const checkS3ObjectUser = asyncHandler(async (req, _, next) => {
  if (req.method === 'OPTIONS') return next();

  const { detail } = req.body;
  const sourceKey = detail.object.key.replace(/\+/g, ' ');
  const userId = sourceKey.split('/')[1];

  req.user = { id: userId };

  next();
});

export const checkApplication = asyncHandler(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const { userMetadata } = req.body.detail;

  if (userMetadata.application !== APPLICATION_NAME) {
    res.json({ message: 'Application not matched' });
  }

  next();
});
