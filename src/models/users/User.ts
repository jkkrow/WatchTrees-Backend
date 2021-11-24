import { ObjectId } from 'mongodb';

export interface User {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  picture?: string;
  verificationToken?: string;
  recoveryToken?: string;
  history: ObjectId[]; // ref to Video Document
  createdAt: Date;
}
