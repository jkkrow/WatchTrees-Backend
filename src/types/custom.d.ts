declare namespace Express {
  export interface Request {
    user?: { id: string; isVerified: boolean; isPremium: boolean };
  }
}
