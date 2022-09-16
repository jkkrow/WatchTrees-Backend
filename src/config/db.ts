import mongoose from 'mongoose';

import { MONGODB_URI } from './env';

mongoose.Promise = global.Promise;
let connection: typeof mongoose | null = null;

export const connectDB = async () => {
  try {
    if (connection && mongoose.connection.readyState === 1) {
      console.log('Using Existing MongoDB Connection');
      return Promise.resolve(connection);
    }

    connection = await mongoose.connect(MONGODB_URI);

    console.log('MongoDB Connected');

    return connection;
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
