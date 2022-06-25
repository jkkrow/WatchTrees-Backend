import { model, Schema, Types } from 'mongoose';

export interface History extends HistoryParams {
  user: Types.ObjectId;
  tree: Types.ObjectId;
}

export interface HistoryDTO extends HistoryParams {
  tree: string;
}

interface HistoryParams {
  activeNodeId: string;
  progress: number;
  totalProgress: number;
  isEnded: boolean;
}

const HistorySchema = new Schema<History>(
  {
    user: { type: Types.ObjectId, required: true, ref: 'User' },
    tree: { type: Types.ObjectId, required: true, ref: 'VideoTree' },
    activeNodeId: { type: String, required: true },
    progress: { type: Number, required: true },
    totalProgress: { type: Number, required: true },
    isEnded: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const HistoryModel = model<History>('History', HistorySchema);
