import { parse } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { s3 } from '../config/aws';
import { HttpError } from '../models/error';

export const initiateMutlipart = async (fileType: string, path: string) => {
  const { dir } = parse(fileType);

  if (dir !== 'video') {
    throw new HttpError(422, 'Invalid file type');
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
    ContentType: fileType,
  };

  return await s3.createMultipartUpload(params).promise();
};

export const processMultipart = async (
  uploadId: string,
  partCount: number,
  path: string
) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
    UploadId: uploadId,
  };

  const presignedUrlPromises: Promise<string>[] = [];

  for (let index = 0; index < partCount; index++) {
    presignedUrlPromises.push(
      s3.getSignedUrlPromise('uploadPart', { ...params, PartNumber: index + 1 })
    );
  }

  // Get presigned urls
  const presignedUrls = await Promise.all(presignedUrlPromises);

  return presignedUrls;
};

export const completeMultipart = async (
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
  path: string
) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  };

  return await s3.completeMultipartUpload(params).promise();
};

export const cancelMultipart = async (uploadId: string, path: string) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
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
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path || `images/${uuidv4()}.${name}`,
    ContentType: fileType,
  };

  const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

  return { presignedUrl, key: params.Key };
};

export const deleteImage = async (path: string) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
  };

  return await s3.deleteObject(params).promise();
};
