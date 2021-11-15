import mongoose from 'mongoose';

import { UserDocument } from './User.model';

export interface VideoInfo {
  name: string;
  label: string;
  size: number;
  duration: number;
  selectionTimeStart: number | null;
  selectionTimeEnd: number | null;
  error: string | null;
  progress: number;
  isConverted: boolean;
  url: string;
}

export interface VideoNode {
  id: string;
  prevId?: string;
  layer: number;
  info: VideoInfo | null;
  children: VideoNode[];
}

export enum VideoStatus {
  Public = 'public',
  Private = 'private',
}

export interface VideoDocument extends mongoose.Document {
  creator: UserDocument['_id'];
  root: VideoNode;
  title: string;
  tags: string[];
  description: string;
  thumbnail: { name: string; url: string };
  size: number;
  maxDuration: number;
  minDuration: number;
  views: number;
  isEditing: boolean;
  status: VideoStatus;
}

const VideoSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  root: {
    id: { type: String, required: true },
    layer: { type: Number, required: false },
    info: {
      name: { type: String },
      size: { type: Number },
      duration: { type: Number },
      label: { type: String },
      selectionTimeStart: { type: Number },
      selectionTimeEnd: { type: Number },
      progress: { type: Number },
      error: { type: String },
      isConverted: { type: Boolean },
      url: { type: String },
    },
    children: { type: Array, required: true },
  },
  title: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  thumbnail: {
    name: { type: String },
    url: { type: String },
  },
  size: { type: Number, required: true },
  maxDuration: { type: Number, required: true },
  minDuration: { type: Number, required: true },
  views: { type: Number, required: true },
  isEditing: { type: Boolean, required: true },
  status: { type: String, enum: ['public', 'private'], required: true },
});

export default mongoose.model<VideoDocument>('Video', VideoSchema);
