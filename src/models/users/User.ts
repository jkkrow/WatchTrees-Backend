import { ObjectId } from 'mongodb';

export interface Channel {
  name: string;
  picture: string;
  subscribers: number;
  subscribes: number;
  isSubscribed: boolean;
}

export interface History {
  video: ObjectId; // ref to Video Document
  progress: {
    activeVideoId: string;
    time: number;
  };
  updatedAt: Date;
}

export interface User {
  type: 'native' | 'google';
  name: string;
  email: string;
  password: string;
  picture: string;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  subscribers: ObjectId[]; // ref to User Document
  subscribes: ObjectId[]; // ref to User Document
  favorites: ObjectId[]; // ref to Video Document
  history: History[];
  createdAt: Date;
  verificationToken?: string;
  recoveryToken?: string;
}

export class UserSchema implements User {
  public picture = '';
  public isVerified = false;
  public isPremium = false;
  public isAdmin = false;
  public subscribers: ObjectId[] = [];
  public subscribes: ObjectId[] = [];
  public favorites: ObjectId[] = [];
  public history: History[] = [];
  public createdAt = new Date();
  public verificationToken?: string;
  public recoveryToken?: string;

  constructor(
    public type: 'native' | 'google',
    public name: string,
    public email: string,
    public password: string
  ) {}
}
