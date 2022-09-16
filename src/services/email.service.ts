import { ServerClient } from 'postmark';
import { HttpError } from '../models/error';
import { EMAIL_SERVER_API_TOKEN, EMAIL_USERNAME_AUTH } from '../config/env';

interface Options {
  to: string;
  subject: string;
  message: string;
  messageStream?: string;
}

const client = new ServerClient(EMAIL_SERVER_API_TOKEN);

export const sendEmail = async (options: Options) => {
  await client.sendEmail({
    From: EMAIL_USERNAME_AUTH,
    To: options.to,
    Subject: options.subject,
    HtmlBody: options.message,
    MessageStream: options.messageStream,
  });
};

export const checkBounce = async (email: string) => {
  const bounces = await client.getBounces({ emailFilter: email });

  if (bounces.TotalCount > 0) {
    throw new HttpError(400, 'This email is bounced');
  }
};
