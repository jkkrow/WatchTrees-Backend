// import { Document, Model, Schema, model, FilterQuery } from 'mongoose';

// import { UserDocument } from './User.model';
// import { validateNodes } from '../../util/tree';

// export interface VideoInfo {
//   name: string;
//   label: string;
//   size: number;
//   duration: number;
//   selectionTimeStart: number | null;
//   selectionTimeEnd: number | null;
//   error: string | null;
//   progress: number;
//   isConverted: boolean;
//   url: string;
// }

// export interface VideoNode {
//   id: string;
//   prevId?: string;
//   layer: number;
//   info: VideoInfo | null;
//   children: VideoNode[];
// }

// export enum VideoStatus {
//   Public = 'public',
//   Private = 'private',
// }

// export interface VideoTree {
//   creator: UserDocument['_id'];
//   root: VideoNode;
//   title: string;
//   tags: string[];
//   description: string;
//   thumbnail: { name: string; url: string };
//   size: number;
//   maxDuration: number;
//   minDuration: number;
//   views: number;
//   isEditing: boolean;
//   status: VideoStatus;
// }

// export interface VideoDocument extends VideoTree, Document {}

// interface VideoModel extends Model<VideoDocument> {
//   findPublics: (filter?: FilterQuery<any>) => Promise<VideoDocument[]>;
// }

// const VideoSchema = new Schema({
//   creator: { type: Schema.Types.ObjectId, ref: 'User' },
//   root: {
//     id: { type: String, required: true },
//     layer: { type: Number, required: false },
//     info: {
//       name: { type: String },
//       size: { type: Number },
//       duration: { type: Number },
//       label: { type: String },
//       selectionTimeStart: { type: Number },
//       selectionTimeEnd: { type: Number },
//       progress: { type: Number },
//       error: { type: String },
//       isConverted: { type: Boolean },
//       url: { type: String },
//     },
//     children: { type: Array, required: true },
//   },
//   title: { type: String },
//   description: { type: String },
//   tags: [{ type: String }],
//   thumbnail: {
//     name: { type: String },
//     url: { type: String },
//   },
//   size: { type: Number, required: true },
//   maxDuration: { type: Number, required: true },
//   minDuration: { type: Number, required: true },
//   views: { type: Number, required: true },
//   isEditing: { type: Boolean, required: true },
//   status: { type: String, enum: ['public', 'private'], required: true },
// });

// VideoSchema.statics.findPublics = function (filter: FilterQuery<any>) {
//   return this.find({ isEditing: false, status: VideoStatus.Public, ...filter });
// };

// VideoSchema.pre('save', function (next) {
//   if (!this.title || validateNodes(this.root, 'info')) {
//     this.isEditing = true;
//   }

//   next();
// });

// export default model<VideoDocument, VideoModel>('Video', VideoSchema);
