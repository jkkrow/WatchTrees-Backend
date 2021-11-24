import { ObjectId } from 'bson';
import { RequestHandler } from 'express';

import { VideoService, VideoDocument } from '../models/videos/VideoService';
import { findById, traverseNodes } from '../util/tree';

export const fetchVideos: RequestHandler = async (req, res, next) => {
  try {
    const videos = await VideoService.findPublics();

    res.json({ videos });
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
    const videos = await VideoService.findByCreator(req.user.id)
      .skip(itemsPerPage * (pageNumber - 1))
      .limit(itemsPerPage)
      .sort({ _id: -1 })
      .project({ 'root.children': -1 });
    console.log(count);

    console.log(count, videos);

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
    let treeId = '';

    if (id) {
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
      uploadTree.creator = req.user.id;

      const { insertedId } = await VideoService.createVideo(uploadTree);

      treeId = insertedId.toString();
    } else {
      const updatedVideo = {
        ...existingVideo,
        ...uploadTree,
        views: existingVideo.views,
      };

      VideoService.updateVideo(updatedVideo);
    }

    res.json({ message: 'Upload progress saved', treeId });
  } catch (err) {
    return next(err);
  }
};

export const deleteVideo: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { id } = req.params;

    await VideoService.deleteVideo(id, req.user.id);

    // TODO: Delete videos & thumbnail from aws s3

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    return next(err);
  }
};
