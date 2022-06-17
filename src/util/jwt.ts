import * as jwt from 'jsonwebtoken';

import { HttpError } from '../models/error';

export const createToken = (payload: string | object | Buffer, exp: string) => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: exp });
};

export const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_KEY!, {
    expiresIn: '7d',
  });
};

export const createAccessToken = (userId: string) => {
  return jwt.sign({ userId, type: 'access' }, process.env.JWT_KEY!, {
    expiresIn: '15m',
  });
};

export const verifyToken = (token: string, message?: string) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY!) as jwt.JwtPayload;
  } catch (err) {
    throw new HttpError(401, message);
  }
};
