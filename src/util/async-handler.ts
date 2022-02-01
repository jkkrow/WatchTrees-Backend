import { RequestHandler } from 'express';

export const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    const handlerPromise = handler(req, res, next);
    return Promise.resolve(handlerPromise).catch(next);
  };
};
