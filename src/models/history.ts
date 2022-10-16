import { HydratedDocument, model, Schema } from 'mongoose';

export interface HistoryDocument extends HydratedDocument<History> {}

export interface History {
  user: Schema.Types.ObjectId;
  tree: Schema.Types.ObjectId;
  activeNodeId: string;
  progress: number;
  totalProgress: number;
  isEnded: boolean;
}

export interface HistoryDTO extends Omit<History, 'user' | 'tree'> {
  tree: string;
}

const HistorySchema = new Schema<History>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    tree: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'VideoTree',
      index: true,
    },
    activeNodeId: { type: String, required: true },
    progress: { type: Number, required: true },
    totalProgress: { type: Number, required: true },
    isEnded: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const HistoryModel = model<History>('History', HistorySchema);
