import * as jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  isVerified: boolean;
  isPremium: boolean;
}

export const createToken = (payload: string | object | Buffer, exp: string) => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: exp });
};

export const createAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '15m' });
};

export const createRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_KEY!) as jwt.JwtPayload;
};
