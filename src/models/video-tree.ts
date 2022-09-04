import { Schema, model, HydratedDocument } from 'mongoose';

import { VideoNodeDTO } from './video-node';

export interface VideoTreeDocument extends HydratedDocument<VideoTree> {}

export interface VideoTree {
  root: string;
  info: TreeInfo;
  data: TreeData;
}

export interface VideoTreeDTO {
  _id: string;
  root: VideoNodeDTO;
  info: TreeInfoDTO;
  data: TreeDataDTO;
}

export interface VideoTreeClient extends VideoTreeDTO {
  info: TreeInfoClient;
  data: TreeDataClient;
  history: History | null;
}

export interface TreeInfo {
  creator: Schema.Types.ObjectId; // ref to User Document
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

export interface TreeInfoDTO extends Omit<TreeInfo, 'creator'> {
  creator: string;
}

export interface TreeInfoClient extends TreeInfoDTO {
  creatorInfo: {
    name: string;
    picture: string;
  };
}

export interface TreeData {
  views: number;
  favorites: Schema.Types.ObjectId[]; // ref to User Document;
}

export interface TreeDataDTO extends Omit<TreeData, 'favorites'> {
  favorites: string[];
}

export interface TreeDataClient extends TreeDataDTO {
  isFavorite: boolean;
}

const VideoTreeSchema = new Schema<VideoTree>(
  {
    root: { type: String, required: true, ref: 'VideoNode' },
    info: {
      creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
      title: { type: String, default: 'Untitled' },
      tags: [{ type: String }],
      description: { type: String },
      thumbnail: {
        name: { type: String, default: '' },
        url: { type: String, default: '' },
      },
      size: { type: Number, required: true, default: 0 },
      maxDuration: { type: Number, required: true, default: 0 },
      minDuration: { type: Number, required: true, default: 0 },
      status: {
        type: String,
        required: true,
        enum: ['public', 'private'],
        default: 'public',
      },
      isEditing: { type: Boolean, required: true, default: true },
    },
    data: {
      views: { type: Number, required: true, default: 0 },
      favorites: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
    },
  },
  { timestamps: true }
);

export const VideoTreeModel = model<VideoTree>('VideoTree', VideoTreeSchema);
