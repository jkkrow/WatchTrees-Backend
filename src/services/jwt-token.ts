import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  isVerified: boolean;
  isPremium: boolean;
}

export const createAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '15m' });
};

export const createRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_KEY!) as TokenPayload;
};
