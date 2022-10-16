import { Schema, model, HydratedDocument } from 'mongoose';

import { VideoNodeDto } from './video-node';

export interface VideoTreeDocument extends HydratedDocument<VideoTree> {}

export interface VideoTree {
  _id: Schema.Types.ObjectId;
  root: string; // ref to VideoNode Document
  creator: Schema.Types.ObjectId; // ref to User Document
  title: string;
  tags: string[];
  description: string;
  thumbnail: string;
  size: number;
  maxDuration: number;
  minDuration: number;
  status: 'public' | 'private';
  isEditing: boolean;
  views: number;
  favorites: Schema.Types.ObjectId[]; // ref to User Document;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoTreeDto
  extends Omit<VideoTree, '_id' | 'root' | 'creator'> {
  _id: string;
  root: VideoNodeDto;
}

export interface VideoTreeClient extends VideoTreeDto {
  creator: {
    _id: string;
    name: string;
    picture: string;
  };
  isFavorite: boolean;
  history: History | null;
}

const VideoTreeSchema = new Schema<VideoTree>(
  {
    root: { type: String, required: true, ref: 'VideoNode' },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    title: { type: String, default: 'Untitled' },
    tags: [{ type: String }],
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    size: { type: Number, default: 0 },
    maxDuration: { type: Number, default: 0 },
    minDuration: { type: Number, default: 0 },
    status: { type: String, enum: ['public', 'private'], default: 'public' },
    isEditing: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    favorites: [{ type: Schema.Types.ObjectId, required: true, ref: 'User' }],
  },
  { timestamps: true }
);

VideoTreeSchema.index({ status: 1, isEditing: 1 });
VideoTreeSchema.index(
  { title: 'text', tags: 'text', description: 'text' },
  { weights: { title: 3, tags: 2, description: 1 } }
);

export const VideoTreeModel = model<VideoTree>('VideoTree', VideoTreeSchema);
