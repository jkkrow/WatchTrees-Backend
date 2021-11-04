import { RequestHandler } from 'express';
import AWS from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';

import User from '../models/data/User.model';
import Video from '../models/data/Video.model';
import HttpError from '../models/common/HttpError';
import { traverseNodes } from '../util/tree';

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_BUCKET_REGION!,
});

export const initiateMultipart: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { treeId, fileName, fileType } = req.query;

    const type = (fileType as string).split('/');

    if (type[0] !== 'video') {
      throw new HttpError(422, 'Invalid file type');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      ContentType: fileType as string,
    };

    const uploadData = await s3.createMultipartUpload(params).promise();

    res.json({ uploadId: uploadData.UploadId });
  } catch (err) {
    return next(err);
  }
};

export const processMultipart: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { uploadId, partNumber, treeId, fileName } = req.query;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId as string,
      PartNumber: partNumber,
    };

    const presignedUrl = await s3.getSignedUrlPromise('uploadPart', params);

    res.json({ presignedUrl });
  } catch (err) {
    return next(err);
  }
};

export const completeMultipart: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { uploadId, parts, treeId, fileName } = req.body.params;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId as string,
      MultipartUpload: { Parts: parts },
    };

    const result = await s3.completeMultipartUpload(params).promise();

    res.json({ url: result.Location });
  } catch (err) {
    return next(err);
  }
};

export const uploadImage: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { fileType } = req.query;

    const type = (fileType as string).split('/');

    if (type[0] !== 'image') {
      throw new HttpError(422, 'Invalid file type');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `images/${req.user.id}/${uuidv1()}`,
      ContentType: fileType as string,
    };

    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

    res.json({ presignedUrl, key: params.Key });
  } catch (err) {
    return next(err);
  }
};

export const saveUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { uploadTree } = req.body;

    const user = await User.findById(req.user.id).populate('videos');

    if (!user) return;

    // Change Nodes with unfinished progress to null
    const nodes = traverseNodes(uploadTree.root);

    nodes.forEach((node) => {
      if (node.info && node.info.progress > 0 && node.info.progress < 100) {
        node.info = null;
      }
    });

    let video = user.videos.find((item) => item.root.id === uploadTree.root.id);

    if (!video) {
      video = new Video(uploadTree);
      user.videos.push(video);
    } else {
      for (let key in uploadTree) {
        video[key] = uploadTree[key];
      }
    }

    if (!video.title || !video.root.info) {
      video.isEditing = true;
    }

    await Promise.all([user.save(), video.save()]);

    res.json({ message: 'Upload progress saved' });
  } catch (err) {
    return next(err);
  }
};

export const cancelUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { treeId, fileName, uploadId } = req.query;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId as string,
    };

    const data = await s3.abortMultipartUpload(params).promise();

    res.json({ data });
  } catch (err) {
    return next(err);
  }
};
