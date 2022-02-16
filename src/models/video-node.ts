import { Schema, model } from 'mongoose';

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

export interface VideoNode extends VideoNodeRef {
  children: VideoNode[];
}

export interface VideoNodeRef {
  _id: string;
  _prevId?: string;
  layer: number;
  info: NodeInfo | null;
}

const VideoNodeSchema = new Schema<VideoNodeRef>({
  _id: { type: String, required: true },
  _prevId: { type: String, ref: 'VideoNode' },
  layer: { type: Number, required: true },
  info: {
    type: {
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
    default: null,
  },
});

export const VideoNodeModel = model<VideoNodeRef>('VideoNode', VideoNodeSchema);
