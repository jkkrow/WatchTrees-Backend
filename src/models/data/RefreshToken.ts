import mongoose, { ObjectId } from 'mongoose';

interface RefreshTokenType {
  key: ObjectId;
  value: string;
}

const RefreshTokenSchema = new mongoose.Schema<RefreshTokenType>({
  key: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: String, required: true },
});

export default mongoose.model<RefreshTokenType>(
  'RefreshToken',
  RefreshTokenSchema
);
