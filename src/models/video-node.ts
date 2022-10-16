import { Schema, model, HydratedDocument } from 'mongoose';

export interface VideoNodeDocument extends HydratedDocument<VideoNode> {}

export interface VideoNode {
  _id: string;
  parentId: string | null; // ref to VideoNode Document
  creator: Schema.Types.ObjectId; // ref to User Document
  level: number;
  name: string;
  label: string;
  size: number;
  duration: number;
  selectionTimeStart: number;
  selectionTimeEnd: number;
  url: string;
}

export interface VideoNodeDto extends Omit<VideoNode, 'creator'> {
  children: this[];
}

export interface RenderNodeDto extends VideoNodeDto {
  error: string | null;
  progress: number;
}

const VideoNodeSchema = new Schema<VideoNode>({
  _id: { type: String },
  parentId: { type: String, ref: 'VideoNode', default: null },
  level: { type: Number, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, default: '' },
  label: { type: String, default: '' },
  url: { type: String, default: '' },
  size: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  selectionTimeStart: { type: Number, default: 0 },
  selectionTimeEnd: { type: Number, default: 0 },
});

export const VideoNodeModel = model<VideoNode>('VideoNode', VideoNodeSchema);
