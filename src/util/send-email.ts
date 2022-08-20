import { ServerClient } from 'postmark';

interface Options {
  to: string;
  subject: string;
  message: string;
  messageStream?: string;
}

const client = new ServerClient(process.env.EMAIL_SERVER_API_TOKEN!);

export const sendEmail = async (options: Options) => {
  try {
    await client.sendEmail({
      From: process.env.EMAIL_USERNAME_AUTH!,
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.message,
      MessageStream: options.messageStream,
    });
  } catch (err) {
    throw new Error((err as Error).message);
  }
};
