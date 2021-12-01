import { ObjectId } from 'mongodb';
import { RequestHandler } from 'express';

import { HttpError } from '../models/error/HttpError';
import { VideoService, VideoDocument } from '../models/videos/VideoService';
import { findById, traverseNodes } from '../util/tree';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  try {
    const { page, max, count } = req.query;

    const itemsPerPage = max ? +max : 10;
    const pageNumber = page ? +page : 1;
    const isCount = count === 'false' ? false : true;

    let videoCount: number | null = null;

    if (isCount) {
      videoCount = await VideoService.countVideos({
        'info.status': 'public',
        'info.isEditing': false,
      });
    }

    const videos = await VideoService.findPublics({}, [
      { $sort: { _id: -1 } },
      { $skip: itemsPerPage * (pageNumber - 1) },
      { $limit: itemsPerPage },
      {
        $lookup: {
          from: 'users',
          localField: 'info.creator',
          foreignField: '_id',
          as: 'info.creatorInfo',
        },
      },
      {
        $project: {
          'root.children': 0,
          'info.creatorInfo': {
            type: 0,
            email: 0,
            password: 0,
            isVerified: 0,
            isPremium: 0,
            isAdmin: 0,
            history: 0,
            createdAt: 0,
          },
        },
      },
      { $unwind: '$info.creatorInfo' },
    ]);

    res.json({ videos, count: videoCount });
  } catch (err) {
    return next(err);
  }
};

export const fetchUserVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page, max } = req.query;

    const itemsPerPage = max ? +max : 10;
    const pageNumber = page ? +page : 1;

    const count = await VideoService.countVideos({
      creator: new ObjectId(req.user.id),
    });
    const videos = await VideoService.findByCreator(req.user.id, {
      skip: itemsPerPage * (pageNumber - 1),
      limit: itemsPerPage,
      sort: { _id: -1 },
      projection: { 'root.children': 0 },
    });

    res.json({ videos: videos, count });
  } catch (err) {
    return next(err);
  }
};

export const saveVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { uploadTree } = req.body;
    const { id } = req.params;

    let existingVideo: VideoDocument | null = null;
    let videoId: string | undefined;

    if (id !== 'undefined') {
      existingVideo = await VideoService.findById(id);
    }

    // Refactor UploadTree fields before change document
    const uploadNodes = traverseNodes(uploadTree.root);

    for (let uploadNode of uploadNodes) {
      let nodeInfo = uploadNode.info;

      if (!nodeInfo) continue;

      if (nodeInfo.progress > 0 && nodeInfo.progress < 100) {
        nodeInfo = null;
      }

      if (!existingVideo) continue;

      const videoNode = findById(existingVideo, uploadNode.id);

      if (!videoNode || !videoNode.info || !nodeInfo) continue;

      nodeInfo.isConverted = videoNode.info.isConverted;
      nodeInfo.url = videoNode.info.url;
    }

    if (!existingVideo) {
      uploadTree.info.creator = new ObjectId(req.user.id);
      uploadTree.data = { views: 0, favorites: 0 };

      const { insertedId } = await VideoService.createVideo(uploadTree);

      if (!insertedId) {
        throw new HttpError(500, 'Saving video failed. Please try again');
      }

      videoId = insertedId.toString();
    }

    if (existingVideo) {
      const updatedVideo = {
        ...existingVideo,
        ...uploadTree,
        _id: existingVideo._id,
        info: { ...uploadTree.info, creator: existingVideo.info.creator },
        data: { ...existingVideo.data },
      };

      const { modifiedCount } = await VideoService.updateVideo(updatedVideo);

      if (!modifiedCount) {
        throw new HttpError(500, 'Saving video failed. Please try again');
      }
    }

    res.json({ message: 'Upload progress saved', videoId });
  } catch (err) {
    return next(err);
  }
};

export const deleteVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    const { deletedCount } = await VideoService.deleteVideo(id, req.user.id);

    if (!deletedCount) {
      throw new HttpError(500, 'Deleting video failed. Please try again');
    }

    // TODO: Delete videos & thumbnail from aws s3

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    return next(err);
  }
};
