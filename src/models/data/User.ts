import mongoose from 'mongoose';

import { VideoType } from './Video';

interface UserType {
  name: string;
  email: string;
  password: string;
  picture?: string;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  token: {
    type: string;
    value: string;
    expiresIn: number;
  };
  videos: VideoType[];
}

const UserSchema = new mongoose.Schema<UserType>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  picture: { type: String, default: '' },
  isVerified: { type: Boolean, required: true, default: false },
  isPremium: { type: Boolean, required: true, default: false },
  isAdmin: { type: Boolean, required: true, default: false },
  token: {
    type: { type: String, required: true },
    value: { type: String, required: true },
    expiresIn: { type: Number, required: true },
  },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
});

export default mongoose.model<UserType>('User', UserSchema);
