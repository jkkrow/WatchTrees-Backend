import { connect } from 'mongoose';

export const connectDB = async (callback: () => void): Promise<void> => {
  try {
    await connect(process.env.MONGODB_URI!);

    console.log('MongoDB Connected');

    callback();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
