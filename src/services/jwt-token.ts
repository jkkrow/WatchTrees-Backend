import * as jwt from 'jsonwebtoken';

import { HttpError } from '../models/error/HttpError';
import { UserDocument } from '../models/users/UserService';

interface UserPayload extends UserDocument {
  id: string;
}

export const createToken = (payload: string | object | Buffer, exp: string) => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: exp });
};

export const createAuthTokens = (
  user: Partial<UserPayload>,
  onlyAccess?: boolean
) => {
  const payload = {
    userId: user._id || user.id,
    isVerified: user.isVerified,
    isPremium: user.isPremium,
  };

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
