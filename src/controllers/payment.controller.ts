import { asyncHandler } from '../util/async-handler';

export const webhookEventHandler = asyncHandler(async (req, res) => {
  const webhookEvent = req.body;

  console.log(webhookEvent);
});
