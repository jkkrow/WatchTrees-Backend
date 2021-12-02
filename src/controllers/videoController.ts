import { ObjectId } from 'mongodb';
import { RequestHandler } from 'express';

import { HttpError } from '../models/error/HttpError';
import { VideoService, VideoDocument } from '../models/videos/VideoService';
import { findById, traverseNodes } from '../util/tree';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  try {
    const { page, max, userId } = req.query;

    const itemsPerPage = max ? +max : 10;
    const pageNumber = page ? +page : 1;

    const filter = userId
      ? { 'info.creator': new ObjectId(userId as string) }
      : {};

    const result = await VideoService.findPublics(filter, [
      {
        $facet: {
          videos: [
            { $sort: { _id: -1 } },
            { $skip: itemsPerPage * (pageNumber - 1) },
            { $limit: itemsPerPage },
            {
              $lookup: {
                from: 'users',
                as: 'info.creatorInfo',
                let: { creator: '$info.creator' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$$creator', '$_id'] } } },
                  { $project: { _id: 0, name: 1, picture: 1 } },
                ],
              },
            },
            { $project: { 'root.children': 0 } },
            { $unwind: '$info.creatorInfo' },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const videos = result[0].videos;
    const count = result[0].totalCount[0].count;

    res.json({ videos, count });
  } catch (err) {
    return next(err);
  }
};

export const fetchCreatedVideos: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { page, max } = req.query;

    const itemsPerPage = max ? +max : 10;
    const pageNumber = page ? +page : 1;

    const videos = await VideoService.findByCreator(req.user.id, [
      { $sort: { _id: -1 } },
      { $skip: itemsPerPage * (pageNumber - 1) },
      { $limit: itemsPerPage },
      { $project: { 'root.children': 0 } },
    ]);

    res.json({ videos: videos });
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

    /*
     * Refactor UploadTree fields before change document
     */

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

    /*
     * Create Video
     */

    if (!existingVideo) {
      const { insertedId } = await VideoService.createVideo(
        uploadTree,
        req.user.id
      );

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
