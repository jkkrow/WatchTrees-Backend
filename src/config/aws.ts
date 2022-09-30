import AWS from 'aws-sdk';
import {
  AWS_CONFIG_ACCESS_KEY_ID,
  AWS_CONFIG_SECRET_ACCESS_KEY,
  AWS_CONFIG_REGION,
  AWS_MEDIACONVERT_ENDPOINT,
} from './env';

AWS.config.update({
  credentials: {
    accessKeyId: AWS_CONFIG_ACCESS_KEY_ID,
    secretAccessKey: AWS_CONFIG_SECRET_ACCESS_KEY,
  },
  region: AWS_CONFIG_REGION,
});

export const S3 = new AWS.S3();
export const MediaConvert = new AWS.MediaConvert({
  endpoint: AWS_MEDIACONVERT_ENDPOINT,
});
