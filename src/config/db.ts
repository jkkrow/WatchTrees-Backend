import mongoose from 'mongoose';

mongoose.Promise = global.Promise;
let connection: any = null;

export const connectDB = async () => {
  try {
    if (connection && mongoose.connection.readyState === 1) {
      console.log('Using Existing MongoDB Connection');
      return Promise.resolve(connection);
    }

    connection = await mongoose.connect(process.env.MONGODB_URI!);

    console.log('MongoDB Connected');

    return connection;
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
