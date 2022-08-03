import { asyncHandler } from '../util/async-handler';

export const createCheckoutSession = asyncHandler(async (req, res) => {
  console.log(req);

  res.redirect('303');
});

export const createPortalSession = asyncHandler(async (req, res) => {
  console.log(req);

  res.redirect('303');
});
