export interface User {
  name: string;
  email: string;
  password: string;
  picture?: string;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  verificationToken?: string;
  recoveryToken?: string;
  history: [];
  createdAt: Date;
}
