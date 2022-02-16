import { Schema, Types, model } from 'mongoose';

import { VideoNode } from './video-node';

export interface TreeInfo {
  creator: Types.ObjectId; // ref to User Document
  title: string;
  tags: string[];
  description: string;
  thumbnail: { name: string; url: string };
  size: number;
  maxDuration: number;
  minDuration: number;
  status: 'public' | 'private';
  isEditing: boolean;
}

export interface TreeInfoWithCreator extends TreeInfo {
  creatorInfo: {
    name: string;
    picture: string;
  };
}

export interface TreeData {
  views: number;
  favorites: Types.ObjectId[]; // ref to User Document;
}

export interface VideoTree {
  root: VideoNode;
  info: TreeInfo;
  data: TreeData;
}

export interface VideoTreeRef {
  root: string;
  info: TreeInfo;
  data: TreeData;
}

export interface VideoTreeClient extends VideoTree {
  info: TreeInfoWithCreator;
  history: History | null;
  data: {
    views: number;
    favorites: Types.ObjectId[];
    isFavorite: boolean;
  };
}

const VideoTreeSchema = new Schema<VideoTreeRef>(
  {
    root: { type: String, required: true, ref: 'VideoNode' },
    info: {
      creator: { type: Types.ObjectId, required: true, ref: 'User' },
      title: { type: String },
      tags: [{ type: String }],
      description: { type: String },
      thumbnail: { name: { type: String }, url: { type: String } },
      size: { type: Number, required: true },
      maxDuration: { type: Number, required: true },
      minDuration: { type: Number, required: true },
      status: { type: String, required: true, enum: ['public', 'private'] },
      isEditing: { type: Boolean, required: true, default: true },
    },
    data: {
      views: { type: Number, required: true, default: 0 },
      favorites: [{ type: Types.ObjectId, required: true, ref: 'User' }],
    },
  },
  { timestamps: true }
);

export const VideoTreeModel = model<VideoTreeRef>('VideoTree', VideoTreeSchema);
