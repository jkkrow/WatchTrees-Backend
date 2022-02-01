import { S3 } from 'aws-sdk';
import { parse } from 'path';
import { v1 as uuidv1 } from 'uuid';

import { HttpError } from '../models/error';

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_BUCKET_REGION!,
});

export const initiateMutlipart = async (
  fileType: string,
  isRoot: boolean,
  path: string
) => {
  const { dir } = parse(fileType);

  if (dir !== 'video') {
    throw new HttpError(422, 'Invalid file type');
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: path,
    ContentType: fileType,
    Metadata: { root: `${isRoot}` },
  };

  return await s3.createMultipartUpload(params).promise();
};

export const processMultipart = async (
  uploadId: string,
  partNumber: string | number,
  path: string
) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: path,
    UploadId: uploadId,
    PartNumber: partNumber,
  };

  return await s3.getSignedUrlPromise('uploadPart', params);
};

export const completeMultipart = async (
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
  path: string
) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  };

  return await s3.completeMultipartUpload(params).promise();
};

export const cancelMultipart = async (uploadId: string, path: string) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: path,
    UploadId: uploadId,
  };

  return await s3.abortMultipartUpload(params).promise();
};

export const uploadImage = async (fileType: string, path?: string) => {
  const { dir, name } = parse(fileType);

  if (dir !== 'image') {
    throw new HttpError(422, 'Invalid file type');
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: path || `images/${uuidv1()}.${name}`,
    ContentType: fileType,
  };

  const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

  return { presignedUrl, key: params.Key };
};

export const deleteImage = async (path: string) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: path,
  };

  return await s3.deleteObject(params).promise();
};
