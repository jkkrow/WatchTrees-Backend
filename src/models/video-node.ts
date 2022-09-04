import { Schema, model, HydratedDocument } from 'mongoose';

export interface VideoNodeDocument extends HydratedDocument<VideoNode> {}

export interface VideoNode {
  _id: string;
  parentId: string | null;
  layer: number;
  creator: Schema.Types.ObjectId;
  info: NodeInfo | null;
}

export interface VideoNodeDTO extends Omit<VideoNode, 'creator'> {
  creator: string;
  children: VideoNodeDTO[];
}

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

const VideoNodeSchema = new Schema<VideoNode>({
  _id: { type: String },
  parentId: { type: String, ref: 'VideoNode', default: null },
  layer: { type: Number, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
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
    _id: false,
  },
});

export const VideoNodeModel = model<VideoNode>('VideoNode', VideoNodeSchema);
