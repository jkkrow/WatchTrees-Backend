import { ObjectId } from 'mongodb';

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
  history: ObjectId[]; // ref to Video Document
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
  public history: ObjectId[] = [];
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
