import * as EmailService from '../services/email.service';
import { asyncHandler } from '../util/async-handler';

export const bounceHandler = asyncHandler(async (req, res) => {
  const { Email, Type, MessageStream, BouncedAt } = req.body;

  await EmailService.createBounce(Email, Type, MessageStream, BouncedAt);

  res.json({ message: 'Webhook triggered successfully' });
});
