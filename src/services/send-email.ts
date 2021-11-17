import { createTransport, SentMessageInfo, TransportOptions } from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

interface Options {
  to: string;
  subject: string;
  message: string;
}

const sendEmail = async (options: Options): Promise<SentMessageInfo> => {
  const client = new OAuth2Client(
    process.env.EMAIL_CLIENT_ID!,
    process.env.EMAIL_CLIENT_SECRET!,
    process.env.EMAIL_REDIRECT_URI!
  );

  client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN!,
  });

  const accessToken = await client.getAccessToken();

  const transportOptions = {
    service: process.env.EMAIL_SERVICE!,
    auth: {
      type: process.env.EMAIL_TYPE!,
      user: process.env.EMAIL_USERNAME!,
      clientId: process.env.EMAIL_CLIENT_ID!,
      clientSecret: process.env.EMAIL_CLIENT_SECRET!,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN!,
      accessToken: accessToken,
    },
  } as TransportOptions;

  const transporter = createTransport(transportOptions);

  const mailOptions = {
    from: process.env.EMAIL_FROM!,
    to: options.to,
    subject: options.subject,
    text: options.message,
    html: options.message,
  };

  return transporter.sendMail(mailOptions);
};

export default sendEmail;
