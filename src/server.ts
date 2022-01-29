import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { connectDB } from './config/db';
import { HttpError } from './models/error';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import videoRoutes from './routes/videoRoutes';
import errorMiddleware from './middlewares/error-middleware';

const PORT = process.env.PORT! || 5000;
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);

app.use('/health', (req, res) => {
  res.json('ok');
});

app.use(() => {
  throw new HttpError(404, 'No routes found');
});

app.use(errorMiddleware);

connectDB(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
