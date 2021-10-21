import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './config/db';
import HttpError from './models/common/HttpError';
import videoRoutes from './routes/videoRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import errorMiddleware from './middlewares/error-middleware';

// Server and DB Setups
connectDB();

const PORT = process.env.PORT! || 5000;
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);

app.use(() => {
  throw new HttpError(404);
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
