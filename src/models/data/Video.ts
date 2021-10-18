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

export interface VideoType {
  root: VideoNode;
  title: string;
  description: string;
  tags: string[];
  size: number;
  maxDuration: number;
  minDuration: number;
  status: VideoStatus;
}

const VideoSchema = new mongoose.Schema<VideoType>({
  root: {
    id: { type: String, required: true },
    layer: { type: Number, required: false },
    info: { type: Object, required: true },
    children: { type: Array, required: true },
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String, required: true }],
  size: { type: Number, required: true },
  maxDuration: { type: Number, required: true },
  minDuration: { type: Number, required: true },
  status: { type: String, required: true },
});

export default mongoose.model<VideoType>('Video', VideoSchema);
