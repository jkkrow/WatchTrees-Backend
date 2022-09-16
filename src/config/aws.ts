import AWS from 'aws-sdk';
import {
  AWS_CONFIG_ACCESS_KEY_ID,
  AWS_CONFIG_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_REGION,
} from './env';

AWS.config.update({
  credentials: {
    accessKeyId: AWS_CONFIG_ACCESS_KEY_ID,
    secretAccessKey: AWS_CONFIG_SECRET_ACCESS_KEY,
  },
});

export const s3 = new AWS.S3({
  region: AWS_S3_BUCKET_REGION,
});
