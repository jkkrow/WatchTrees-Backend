import mongoose from 'mongoose';

import { VideoDocument } from './Video.model';

export interface User {
  name: string;
  email: string;
  password: string;
  picture?: string;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  token: {
    type?: string;
    value?: string;
    expiresIn?: number;
  };
  videos: VideoDocument['_id'][];
}

export interface UserDocument extends User, mongoose.Document {}

interface UserModel extends mongoose.Model<UserDocument> {}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  picture: { type: String, default: '' },
  isVerified: { type: Boolean, required: true, default: false },
  isPremium: { type: Boolean, required: true, default: false },
  isAdmin: { type: Boolean, required: true, default: false },
  token: {
    type: { type: String },
    value: { type: String },
    expiresIn: { type: Number },
  },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
});

export default mongoose.model<UserDocument, UserModel>('User', UserSchema);
