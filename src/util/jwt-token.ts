import * as jwt from 'jsonwebtoken';

import { HttpError } from '../models/error';

export const createToken = (payload: string | object | Buffer, exp: string) => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: exp });
};

export const createAuthTokens = (userId: string, onlyAccess?: boolean) => {
  const payload = { userId };

  let refreshToken = '';

  if (!onlyAccess) {
    refreshToken = jwt.sign(payload, process.env.JWT_KEY!, {
      expiresIn: '7d',
    });
  }

  const accessToken = jwt.sign(payload, process.env.JWT_KEY!, {
    expiresIn: '15m',
  });

  return onlyAccess ? { accessToken } : { refreshToken, accessToken };
};

export const verifyToken = (token: string, message?: string) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY!) as jwt.JwtPayload;
  } catch (err) {
    throw new HttpError(401, message);
  }
};
