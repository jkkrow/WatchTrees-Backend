import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI!);

    console.log(`MongoDB Connected: ${connect.connection.host}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

export default connectDB;
