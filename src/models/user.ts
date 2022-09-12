import { Schema, model, HydratedDocument } from 'mongoose';

export interface UserDocument extends HydratedDocument<User> {}

export interface User {
  type: 'native' | 'google';
  name: string;
  email: string;
  password: string;
  picture: string;
  isVerified: boolean;
  isAdmin: boolean;
  premium: UserPremium | null;
  subscribers: Schema.Types.ObjectId[]; // ref to User Document
}

export interface UserPremium {
  id: string;
  name: 'Standard' | 'Business' | 'Enterprise';
  expiredAt: Date;
  isCancelled: boolean;
}

export interface Channel {
  name: string;
  picture: string;
  subscribers: number;
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
    isAdmin: { type: Boolean, required: true, default: false },
    premium: {
      type: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        expiredAt: { type: Date, required: true },
        isCancelled: { type: Boolean, required: true, default: false },
      },
      default: null,
      _id: false,
    },
    subscribers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const UserModel = model<User>('User', UserSchema);
