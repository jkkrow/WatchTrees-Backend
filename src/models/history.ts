import { model, Schema, Types } from 'mongoose';

export interface History {
  user: Types.ObjectId; // ref to User Document
  video: Types.ObjectId; // ref to Video Document
  progress: {
    activeVideoId: string;
    time: number;
    isEnded: boolean;
  };
}

const HistorySchema = new Schema<History>(
  {
    user: { type: Types.ObjectId, required: true, ref: 'User' },
    video: { type: Types.ObjectId, required: true, ref: 'Video' },
    progress: {
      activeVideoId: { type: String },
      time: { type: Number },
      isEnded: { type: Boolean },
    },
  },
  { timestamps: true }
);

export const HistoryModel = model<History>('History', HistorySchema);
