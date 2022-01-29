import { Schema, Types, model } from 'mongoose';

export interface NodeInfo {
  name: string;
  label: string;
  size: number;
  duration: number;
  selectionTimeStart: number;
  selectionTimeEnd: number;
  error: string | null;
  progress: number;
  isConverted: boolean;
  url: string;
}

export interface VideoNode {
  id: string;
  prevId?: string;
  layer: number;
  info: NodeInfo | null;
  children: VideoNode[];
}

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

export interface VideoTreeClient extends VideoTree {
  info: TreeInfoWithCreator;
  history: History | null;
  data: {
    views: number;
    favorites: Types.ObjectId[];
    isFavorite: boolean;
  };
}

const VideoSchema = new Schema<VideoTree>(
  {
    root: {
      id: { type: String, required: true },
      prevId: { type: String },
      layer: { type: Number, required: true },
      info: {
        name: { type: String },
        label: { type: String },
        size: { type: Number },
        duration: { type: Number },
        selectionTimeStart: { type: Number },
        selectionTimeEnd: { type: Number },
        error: { type: String || null },
        progress: { type: Number },
        isConverted: { type: Boolean },
        url: { type: String },
      },
      children: [],
    },
    info: {
      creator: { type: Types.ObjectId, required: true, ref: 'User' }, // ref to User Document
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
      favorites: [{ type: Types.ObjectId, required: true, ref: 'User' }], // ref to User Document;
    },
  },
  { timestamps: true }
);

export const VideoModel = model<VideoTree>('Video', VideoSchema);
