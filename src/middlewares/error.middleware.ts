import { ErrorRequestHandler } from 'express';

const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  console.log(error);

  if (res.headersSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || 'An unknown error occurred!' });
};

export default errorMiddleware;
