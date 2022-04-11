import 'source-map-support/register';
import serverlessExpress from '@vendia/serverless-express';
import { Context, APIGatewayEvent } from 'aws-lambda';

import app from './app';
import { connectDB } from './config/db';

let serverlessExpressInstance: any;

const setup = async (event: APIGatewayEvent, context: Context) => {
  await connectDB();

  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
};

export const handler = async (event: APIGatewayEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }

  return setup(event, context);
};
