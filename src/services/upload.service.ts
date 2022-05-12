import { s3 } from '../config/aws';

export const initiateMultipart = async (fileType: string, path: string) => {
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

export const uploadObject = async (fileType: string, path: string) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
    ContentType: fileType,
  };

  const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

  return { presignedUrl, key: params.Key };
};

export const deleteObject = async (path: string) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
  };

  return await s3.deleteObject(params).promise();
};

export const deleteDirectory = async (path: string) => {
  const prefixes = await getDirectoryPrefixes(path);
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: path,
  };
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Delete: {
      Objects: prefixes,
    },
  };

  if (prefixes.length > 0) {
    return s3.deleteObjects(deleteParams).promise();
  }

  return s3.deleteObject(params).promise();
};

export const getDirectoryPrefixes = async (path: string) => {
  const prefixes: { Key: string }[] = [];
  const promises: Promise<{ Key: string }[]>[] = [];
  const listParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Prefix: path,
    Delimiter: '/',
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();
  const listedContents = listedObjects.Contents;
  const listedPrefixes = listedObjects.CommonPrefixes;

  if (listedContents && listedContents.length) {
    listedContents.forEach(({ Key }) => {
      Key && prefixes.push({ Key });
    });
  }

  if (listedPrefixes && listedPrefixes.length) {
    listedPrefixes.forEach(({ Prefix }) => {
      Prefix && prefixes.push({ Key: Prefix });
      Prefix && promises.push(getDirectoryPrefixes(Prefix));
    });
  }

  const subPrefixes = await Promise.all(promises);

  subPrefixes.forEach((arrPrefixes) => {
    arrPrefixes.forEach((prefix) => {
      prefixes.push(prefix);
    });
  });

  return prefixes;
};
