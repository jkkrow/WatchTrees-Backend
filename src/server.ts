import app from './app';
import { connectDB } from './config/db';
import { PORT } from './config/env';

const initiateServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT || 5000}`);
  });
};

initiateServer();
