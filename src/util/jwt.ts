import * as jwt from 'jsonwebtoken';

import { HttpError } from '../models/error';

type TokenType = 'verification' | 'recovery' | 'refresh' | 'access';
type TokenExp = '7d' | '1d' | '1h' | '15m';

export const createToken = (userId: string, type: TokenType, exp: TokenExp) => {
  return jwt.sign({ userId, type }, process.env.JWT_KEY!, { expiresIn: exp });
};

export const verifyToken = (
  token: string,
  type: TokenType,
  message?: string
) => {
  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_KEY!
    ) as jwt.JwtPayload;

    if (decodedToken.type !== type) {
      throw new HttpError(401, 'Invalid token');
    }

    return decodedToken;
  } catch (err) {
    throw new HttpError(401, message || 'Invalid token');
  }
};
