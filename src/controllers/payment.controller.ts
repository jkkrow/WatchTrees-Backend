import braintree from 'braintree';

import { asyncHandler } from '../util/async-handler';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: '',
  publicKey: '',
  privateKey: '',
});

export const webhookEventHandler = asyncHandler(async (req, res) => {
  const webhookEvent = req.body;

  console.log(webhookEvent);
});
