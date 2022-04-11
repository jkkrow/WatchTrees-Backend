import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { HttpError } from './models/error';
import userRoute from './routes/user.route';
import videoRoute from './routes/video.route';
import historyRoute from './routes/history.route';
import errorMiddleware from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoute);
app.use('/api/videos', videoRoute);
app.use('/api/histories', historyRoute);

app.use('/health', (req, res) => {
  res.json('ok');
});

app.use(() => {
  throw new HttpError(404, 'No routes found');
});

app.use(errorMiddleware);

export default app;
