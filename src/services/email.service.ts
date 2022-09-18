import { ServerClient } from 'postmark';

import { BounceModel } from '../models/bounce';
import { HttpError } from '../models/error';
import { EMAIL_SERVER_API_TOKEN } from '../config/env';

const client = new ServerClient(EMAIL_SERVER_API_TOKEN);

export const createBounce = async (
  email: string,
  type: string,
  messageStream: string,
  bouncedAt: string
) => {
  const bounce = new BounceModel({
    email,
    type,
    messageStream,
    bouncedAt: new Date(bouncedAt),
  });

  return await bounce.save();
};

export const deleteBounce = async (email: string) => {
  const bounce = await BounceModel.findOne({ email });

  if (!bounce) {
    return;
  }

  return await bounce.remove();
};

export const checkBounce = async (email: string) => {
  const bounce = await BounceModel.findOne({ email });

  if (bounce) {
    throw new HttpError(
      400,
      'This email has bounced history. To enable it, please contact to support'
    );
  }

  return;
};

export const sendEmail = async (options: {
  from: string;
  to: string;
  subject: string;
  message: string;
  messageStream?: string;
}) => {
  await checkBounce(options.to);

  return await client.sendEmail({
    From: options.from,
    To: options.to,
    Subject: options.subject,
    HtmlBody: options.message,
    MessageStream: options.messageStream,
  });
};
