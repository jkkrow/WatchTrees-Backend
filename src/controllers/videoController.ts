import { RequestHandler } from 'express';
import mongoose from 'mongoose';

import HttpError from '../models/common/HttpError';
import User from '../models/data/User.model';
import Video from '../models/data/Video.model';
import { findById, traverseNodes, validateNodes } from '../util/tree';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  try {
    const videos = await Video.findPublics();

    res.json({ videos });
  } catch (err) {
    return next(err);
  }
};

export const saveVideo: RequestHandler = async (req, res, next) => {
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

      if (!videoNode || !videoNode.info || !nodeInfo) continue;

      nodeInfo.isConverted = videoNode.info.isConverted;
      nodeInfo.url = videoNode.info.url;
    }

    if (!video) {
      uploadTree.creator = req.user.id;

      video = new Video(uploadTree);
      user.videos.push(video);
    } else {
      for (let key in uploadTree) {
        key !== 'views' && (video[key] = uploadTree[key]);
      }
    }

    if (!video.title || validateNodes(video.root, 'info')) {
      video.isEditing = true;
    }

    const session = await mongoose.startSession();

    session.withTransaction(() => Promise.all([user.save(), video.save()]));

    res.json({ message: 'Upload progress saved' });
  } catch (err) {
    return next(err);
  }
};

export const deleteVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const video = await Video.findById(id).populate('creator');

    if (!video) {
      throw new HttpError(404, 'No video found');
    }

    if (req.user.id !== video.creator._id.toString()) {
      throw new HttpError(403, 'Not authorized to delete this video');
    }

    const treeId = video.root.id;

    const session = await mongoose.startSession();

    session.withTransaction(() => {
      video.creator.videos.pull(video);
      return Promise.all([video.remove({ session }), video.creator.save()]);
    });

    // TODO: Delete videos & thumbnail from aws s3

    res.json({ message: 'Video deleted successfully', treeId });
  } catch (err) {
    return next(err);
  }
};
