import mongoose, { ObjectId } from 'mongoose';

export interface RefreshTokenDocument extends mongoose.Document {
  key: ObjectId;
  value: string;
}

const RefreshTokenSchema = new mongoose.Schema({
  key: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: String, required: true },
});

export default mongoose.model<RefreshTokenDocument>(
  'RefreshToken',
  RefreshTokenSchema
);
