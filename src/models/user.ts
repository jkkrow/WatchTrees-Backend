import { Schema, Types, model } from 'mongoose';

export interface User {
  type: 'native' | 'google';
  name: string;
  email: string;
  password: string;
  picture: string;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  subscribers: Types.ObjectId[]; // ref to User Document
  subscribes: Types.ObjectId[]; // ref to User Document
  favorites: Types.ObjectId[]; // ref to Video Document
  history: History[];
  verificationToken?: string;
  recoveryToken?: string;
}

export interface History {
  video: Types.ObjectId; // ref to Video Document
  progress: {
    activeVideoId: string;
    time: number;
    isEnded: boolean;
  };
  updatedAt: Date;
}

export interface Channel {
  name: string;
  picture: string;
  subscribers: number;
  subscribes: number;
  isSubscribed: boolean;
}

const UserSchema = new Schema<User>(
  {
    type: { type: String, required: true, enum: ['native', 'google'] },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: { type: String },
    isVerified: { type: Boolean, required: true, default: false },
    isPremium: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, required: true, default: false },
    subscribers: [{ type: Types.ObjectId, ref: 'User' }],
    subscribes: [{ type: Types.ObjectId, ref: 'User' }],
    favorites: [{ type: Types.ObjectId, ref: 'Video' }],
    history: [
      {
        video: { type: Types.ObjectId, ref: 'Video' },
        progress: {
          activeVideoId: { type: String },
          time: { type: Number },
          isEnded: { type: Boolean },
        },
        updatedAt: { type: Date },
      },
    ],
    verificationToken: { type: String },
    recoveryToken: { type: String },
  },
  { timestamps: true }
);

export const UserModel = model<User>('User', UserSchema);
