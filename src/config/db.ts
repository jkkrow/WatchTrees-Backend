import { connect } from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    await connect(process.env.MONGODB_URI!);

    console.log('MongoDB Connected');
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

export default connectDB;
