import mongoose from 'mongoose';

interface VideoNode {
  id: string;
  prevId?: string;
  layer: number;
  info: Object;
  children: VideoNode[];
}

export enum VideoStatus {
  Progressing = 'Progressing',
  Completed = 'Completed',
}

export interface VideoDocument extends mongoose.Document {
  root: VideoNode;
  title: string;
  description: string;
  tags: string[];
  size: number;
  maxDuration: number;
  minDuration: number;
  status: VideoStatus;
}

const VideoSchema = new mongoose.Schema({
  root: {
    id: { type: String, required: true },
    layer: { type: Number, required: false },
    info: { type: Object, required: true },
    children: { type: Array, required: true },
  },
  title: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  size: { type: Number, required: true },
  maxDuration: { type: Number, required: true },
  minDuration: { type: Number, required: true },
  status: { type: String, required: true },
});

export default mongoose.model<VideoDocument>('Video', VideoSchema);
