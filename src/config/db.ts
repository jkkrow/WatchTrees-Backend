import { Db, MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

export let db: Db;

export const session = client.startSession;

export const connectDB = async (): Promise<void> => {
  try {
    await client.connect();

    db = client.db();

    console.log('MongoDB Connected');
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
