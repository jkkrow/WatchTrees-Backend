import * as AuthService from '../services/auth.service';
// import * as EmailService from '../services/email.service';
import { asyncHandler } from '../util/async-handler';
import { User } from '../models/user';

export const userCreateEventHandler = asyncHandler(async (req, res) => {
  const user: User = req.body.detail.fullDocument;

  await AuthService.sendVerification(user.email);

  res.json({ message: 'Webhook triggered successfully' });
});

// export const userDeleteEventHandler = asyncHandler(async (req, res) => {
//   const user: User = req.body.detail.fullDocumentBeforeChange;

//   await EmailService.sendEmail({
//     to: user.email,
//     subject: 'Account deleted',
//     message: `
//       <h3>Your account has been deleted successfully</h3>
//       <p>Your account and created contents will no longer be available.</p>
//       <p>Also, you will no longer receive email from our services.</p>
//       <p>Thank you for using our services.</p>
//       `,
//   });

//   res.json({ message: 'Webhook triggered successfully' });
// });
