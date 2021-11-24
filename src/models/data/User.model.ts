// import { Document, Model, Schema, model } from 'mongoose';
// import { hash, compare } from 'bcrypt';

// import { VideoDocument } from './Video.model';

// export interface User {
//   name: string;
//   email: string;
//   password: string;
//   picture?: string;
//   isVerified: boolean;
//   isPremium: boolean;
//   isAdmin: boolean;
//   token: {
//     type?: string;
//     value?: string;
//     expiresIn?: number;
//   };
//   videos: VideoDocument['_id'][];
//   history: VideoDocument['_id'][];
// }

// export interface UserDocument extends User, Document {
//   hashPassword: () => Promise<void>;
//   checkPassword: (password: string) => Promise<boolean>;
// }

// interface UserModel extends Model<UserDocument> {}

// const UserSchema = new Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   picture: { type: String, default: '' },
//   isVerified: { type: Boolean, required: true, default: false },
//   isPremium: { type: Boolean, required: true, default: false },
//   isAdmin: { type: Boolean, required: true, default: false },
//   token: {
//     type: { type: String },
//     value: { type: String },
//     expiresIn: { type: Number },
//   },
//   videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
//   history: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
// });

// UserSchema.methods.hashPassword = async function () {
//   this.password = await hash(this.password, 12);
// };

// UserSchema.methods.checkPassword = async function (password: string) {
//   const result = await compare(password, this.password);

//   return result;
// };

// export default model<UserDocument, UserModel>('User', UserSchema);
