import { MongoClient } from 'mongodb';

export const client = new MongoClient(process.env.MONGODB_URI!);

export const session = client.startSession;

export const connectDB = async (): Promise<void> => {
  try {
    await client.connect();

    console.log('MongoDB Connected');
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
