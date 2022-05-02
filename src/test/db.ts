import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodb: MongoMemoryServer;

export const connectDB = async () => {
  mongodb = await MongoMemoryServer.create();
  await mongoose.connect(mongodb.getUri(), { dbName: 'watchtrees' });
};

export const clearDB = async () => {
  const { collections } = mongoose.connection;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

export const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongodb.stop();
};
