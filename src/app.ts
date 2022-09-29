import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { HttpError } from './models/error';
import UserRoute from './routes/user.route';
import VideoTreeRoute from './routes/video-tree.route';
import HistoryRoute from './routes/history.route';
import UploadRoute from './routes/upload.route';
import PaymentRoute from './routes/payment.route';
import EmailRoute from './routes/email.route';
import EventRoute from './routes/event.route';
import errorMiddleware from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/users', UserRoute);
app.use('/video-trees', VideoTreeRoute);
app.use('/histories', HistoryRoute);
app.use('/upload', UploadRoute);
app.use('/payment', PaymentRoute);
app.use('/email', EmailRoute);
app.use('/events', EventRoute);

app.use('/health', (req, res) => {
  res.json('ok');
});

app.use(() => {
  throw new HttpError(404, 'No routes found');
});

app.use(errorMiddleware);

export default app;
