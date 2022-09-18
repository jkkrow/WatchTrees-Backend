import { HydratedDocument, model, Schema } from 'mongoose';

export interface BounceDocument extends HydratedDocument<Bounce> {}

export interface Bounce {
  email: string;
  type: string;
  messageStream: string;
  bouncedAt: Date;
}

const BounceSchema = new Schema<Bounce>({
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  messageStream: { type: String, required: true },
  bouncedAt: { type: Date, required: true },
});

export const BounceModel = model<Bounce>('Bounce', BounceSchema);
