import { RequestHandler } from 'express';
import { v1 as uuidv1 } from 'uuid';
import AWS from 'aws-sdk';
import path from 'path';

import User from '../models/data/User.model';
import Video from '../models/data/Video.model';
import HttpError from '../models/common/HttpError';
import { findById, traverseNodes } from '../util/tree';

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
    const { treeId, nodeId, fileName, fileType } = req.query as {
      treeId: string;
      nodeId: string;
      fileName: string;
      fileType: string;
    };

    const { dir } = path.parse(fileType);

    if (dir !== 'video') {
      throw new HttpError(422, 'Invalid file type');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      ContentType: fileType,
      Metadata: { isRoot: `${treeId === nodeId}` },
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
    const { uploadId, treeId, fileName, partNumber } = req.query as {
      uploadId: string;
      treeId: string;
      fileName: string;
      partNumber: string;
    };

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId,
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
    const { uploadId, treeId, fileName, parts } = req.body.params as {
      uploadId: string;
      treeId: string;
      fileName: string;
      parts: { ETag: string; PartNumber: number }[];
    };

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    };

    const result = await s3.completeMultipartUpload(params).promise();

    res.json({ url: result.Key });
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

    let video = user.videos.find((item) => item.root.id === uploadTree.root.id);

    // Refactor UploadTree fields before change document
    const uploadNodes = traverseNodes(uploadTree.root);

    for (let uploadNode of uploadNodes) {
      let nodeInfo = uploadNode.info;

      if (!nodeInfo) continue;

      if (nodeInfo.progress > 0 && nodeInfo.progress < 100) {
        nodeInfo = null;
      }

      if (!video) continue;

      const videoNode = findById(video, uploadNode.id);

      if (!videoNode || !videoNode.info) continue;

      nodeInfo.isConverted = videoNode.info.isConverted;
      nodeInfo.url = videoNode.info.url;
    }

    if (!video) {
      video = new Video(uploadTree);
      user.videos.push(video);
    } else {
      for (let key in uploadTree) {
        key !== 'views' && (video[key] = uploadTree[key]);
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
    const { uploadId, treeId, fileName } = req.query as {
      uploadId: string;
      treeId: string;
      fileName: string;
    };

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId,
    };

    const data = await s3.abortMultipartUpload(params).promise();

    res.json({ data });
  } catch (err) {
    return next(err);
  }
};

export const uploadImage: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { fileType } = req.query as { fileType: string };

    const { dir, name } = path.parse(fileType);

    if (dir !== 'image') {
      throw new HttpError(422, 'Invalid file type');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `images/${req.user.id}/${uuidv1()}.${name}`,
      ContentType: fileType,
    };

    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

    res.json({ presignedUrl, key: params.Key });
  } catch (err) {
    return next(err);
  }
};
