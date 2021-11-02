import { RequestHandler } from 'express';
import AWS from 'aws-sdk';

import User from '../models/data/User.model';
import Video from '../models/data/Video.model';
import { traverseNodes } from '../util/tree';

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_BUCKET_REGION!,
});

export const initiateUpload: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { treeId, fileName, fileType } = req.query;

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

export const getUploadUrl: RequestHandler = async (req, res, next) => {
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

export const completeUpload: RequestHandler = async (req, res, next) => {
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
      video.root = uploadTree.root;
      video.title = uploadTree.title;
      video.description = uploadTree.description;
      video.tags = uploadTree.tags;
      video.size = uploadTree.size;
      video.maxDuration = uploadTree.maxDuration;
      video.minDuration = uploadTree.minDuration;
      video.status = uploadTree.status;
    }

    await Promise.all([user.save(), video.save()]);

    res.json({ message: 'Saved video successfully.' });
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
