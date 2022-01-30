import { startSession, Types } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';

import { VideoModel, VideoTree } from '../models/video';
import { UserModel } from '../models/user';
import {
  creatorInfoPipeline,
  favoritesPipeline,
  historyPipeline,
} from './pipelines/video.pipeline';
import { HttpError } from '../models/error';
import { traverseNodes, findNodeById, validateNodes } from '../util/tree';

export const findById = (id: string) => {
  return VideoModel.findById(id);
};

export const create = async (currentUserId: string) => {
  const videoTree = {
    root: {
      id: uuidv1(),
      layer: 0,
      info: null,
      children: [],
    },
    info: {
      creator: new Types.ObjectId(currentUserId),
      title: '',
      tags: [],
      description: '',
      size: 0,
      maxDuration: 0,
      minDuration: 0,
      thumbnail: { name: '', url: '' },
      status: 'public',
      isEditing: true,
    },
    data: {
      views: 0,
      favorites: [],
    },
  };

  const newVideo = new VideoModel(videoTree);

  return await newVideo.save();
};

export const update = async (id: string, uploadTree: VideoTree) => {
  const video = await VideoModel.findById(id);

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  if (uploadTree.info.creator.toString() !== video.info.creator.toString()) {
    throw new HttpError(403);
  }

  // Refactor video
  const uploadNodes = traverseNodes(uploadTree.root);

  for (let uploadNode of uploadNodes) {
    if (!uploadNode.info || !video) continue;

    const videoNode = findNodeById(video, uploadNode.id);

    if (videoNode && videoNode.info && videoNode.info.isConverted) {
      uploadNode.info.isConverted = videoNode.info.isConverted;
      uploadNode.info.url = videoNode.info.url;
    }

    if (uploadNode.info.progress > 0 && uploadNode.info.progress < 100) {
      uploadNode.info = null;
    }
  }

  // Update video
  video.root = uploadTree.root;
  video.info = uploadTree.info;

  if (!video.info.title || validateNodes(video.root, 'info')) {
    video.info.isEditing = true;
  }

  return await video.save();
};

export const remove = async (id: string, currentUserId: string) => {
  const video = await VideoModel.findById(id);

  if (!video) {
    return;
  }

  if (video.info.creator.toString() !== currentUserId) {
    throw new HttpError(403, 'Not authorized to remove video');
  }

  return await video.remove();
};

export const getClient = async (id: string, currentUserId?: string) => {
  const result = await VideoModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...creatorInfoPipeline(),
    ...favoritesPipeline(currentUserId),
    ...historyPipeline(currentUserId),
  ]);

  return result[0];
};

export const getClients = async ({
  match,
  sort,
  page,
  max,
  currentUserId,
}: {
  match: any;
  sort?: any;
  page?: number;
  max?: number;
  currentUserId?: string;
}) => {
  const sortPipeline = sort ? [{ $sort: sort }] : [{ $sort: { _id: -1 } }];
  const skipPipeline = page && max ? [{ $skip: max * (page - 1) }] : [];
  const limitPipeline = max ? [{ $limit: max }] : [];

  const result = await VideoModel.aggregate([
    { $match: match },
    {
      $facet: {
        videos: [
          ...sortPipeline,
          ...skipPipeline,
          ...limitPipeline,
          { $project: { 'root.children': 0 } },
          ...creatorInfoPipeline(),
          ...favoritesPipeline(currentUserId),
          ...historyPipeline(currentUserId),
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
    { $unwind: '$totalCount' },
  ]);

  return {
    videos: result.length ? result[0].videos : [],
    count: result.length ? result[0].totalCount.count : 0,
  };
};

export const getFavorites = async (id: string, page: number, max: number) => {
  const result = await UserModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'videos',
        as: 'favorites',
        let: { favorites: '$favorites' },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$favorites'] } } },
          {
            $facet: {
              videos: [
                { $sort: { _id: -1 } },
                { $skip: max * (page - 1) },
                { $limit: max },
                { $project: { 'root.children': 0 } },
                ...creatorInfoPipeline(),
                ...favoritesPipeline(id),
                ...historyPipeline(id),
              ],
              totalCount: [{ $count: 'count' }],
            },
          },
          { $unwind: '$totalCount' },
        ],
      },
    },
    { $project: { favorites: 1 } },
  ]);

  const { favorites } = result[0];

  const videos = favorites.length ? favorites[0].videos : [];
  const count = favorites.length ? favorites[0].totalCount.count : 0;

  return { videos, count };
};

export const incrementViews = (id: string) => {
  return VideoModel.updateOne({ _id: id }, { $inc: { 'data.views': 1 } });
};

export const addToFavorites = async (
  targetId: string,
  currentUserId: string
) => {
  const session = await startSession();

  await session.withTransaction(async () => {
    await Promise.all([
      VideoModel.updateOne(
        { _id: targetId },
        { $addToSet: { 'data.favorites': currentUserId } }
      ),
      UserModel.updateOne(
        { _id: currentUserId },
        { $addToSet: { favorites: targetId } }
      ),
    ]);
  });

  await session.endSession();
};

export const removeFromFavorites = async (
  targetId: string,
  currentUserId: string
) => {
  const session = await startSession();

  await session.withTransaction(async () => {
    await Promise.all([
      VideoModel.updateOne(
        { _id: targetId },
        { $pull: { 'data.favorites': currentUserId } }
      ),
      UserModel.updateOne(
        { _id: currentUserId },
        { $pull: { favorites: targetId } }
      ),
    ]);
  });

  await session.endSession();
};
