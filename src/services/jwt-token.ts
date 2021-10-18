import jwt, { JwtPayload } from 'jsonwebtoken';

export const createAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '15m' });
};

export const createRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_KEY!) as JwtPayload;
};
