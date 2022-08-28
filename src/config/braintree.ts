import braintree from 'braintree';

export const gateway = new braintree.BraintreeGateway({
  environment:
    braintree.Environment[
      process.env.BRAINTREE_ENVIRONMENT as braintree.Environment
    ],
  merchantId: process.env.BRAINTREE_MERCHANT_ID!,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
});
