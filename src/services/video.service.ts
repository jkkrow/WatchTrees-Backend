import { FilterQuery, startSession, Types } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';

import { VideoModel, VideoTree } from '../models/video';
import { UserModel, History } from '../models/user';
import { creatorInfoPipeline, historyPipeline } from '../util/pipelines';
import { HttpError } from '../models/error';
import { traverseNodes, findNodeById, validateNodes } from '../util/tree';

export const findById = (id: string) => {
  return VideoModel.findById(id);
};

export const findOne = (filter: FilterQuery<VideoTree>) => {
  return VideoModel.findOne(filter);
};

export const find = (filter: FilterQuery<VideoTree>) => {
  return VideoModel.find(filter).exec();
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

export const getVideoClient = async (id: string, currentUserId?: string) => {
  const result = await VideoModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    {
      $addFields: {
        'data.favorites': { $size: '$data.favorites' },
        'data.isFavorite': currentUserId
          ? { $in: [currentUserId, '$data.favorites'] }
          : false,
      },
    },
    ...creatorInfoPipeline(),
    ...historyPipeline(currentUserId),
  ]);

  return result[0];
};

export const getVideoClients = async ({
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
          {
            $addFields: {
              'data.favorites': { $size: '$data.favorites' },
              'data.isFavorite': currentUserId
                ? { $in: [currentUserId, '$data.favorites'] }
                : false,
            },
          },
          ...creatorInfoPipeline(),
          ...historyPipeline(currentUserId),
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
    { $unwind: '$totalCount' },
  ]).exec();

  const videos = result.length ? result[0].videos : [];
  const count = result.length ? result[0].totalCount.count : 0;

  return { videos, count };
};

export const getVideoHistory = async (
  id: string,
  page: number,
  max: number,
  skipFullyWatched = false
) => {
  const extraMatchPipeline = skipFullyWatched
    ? [{ $match: { 'history.progress.isEnded': false } }]
    : [];

  const result = await UserModel.aggregate([
    { $match: { _id: id } },
    { $unwind: '$history' },
    {
      $facet: {
        videos: [
          ...extraMatchPipeline,
          { $sort: { 'history.updatedAt': -1 } },
          { $skip: max * (page - 1) },
          { $limit: max },
          {
            $lookup: {
              from: 'videos',
              as: 'history',
              let: { history: '$history' },
              pipeline: [
                { $match: { $expr: { $eq: ['$$history.video', '$_id'] } } },
                { $project: { 'root.children': 0 } },
                {
                  $addFields: {
                    'data.favorites': { $size: '$data.favorites' },
                    'data.isFavorite': { $in: [id, '$data.favorites'] },
                    history: '$$history',
                  },
                },
                ...creatorInfoPipeline(),
              ],
            },
          },
          { $unwind: '$history' },
          {
            $group: {
              _id: '$_id',
              videos: { $push: '$history' },
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
    { $unwind: '$videos' },
    { $unwind: '$totalCount' },
  ]).exec();

  const videos = result.length ? result[0].videos.videos : [];
  const count = result.length ? result[0].totalCount.count : 0;

  return { videos, count };
};

export const getFavorites = async (id: string, page: number, max: number) => {
  const result = await UserModel.aggregate([
    { $match: { _id: id } },
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
                {
                  $addFields: {
                    'data.favorites': { $size: '$data.favorites' },
                    'data.isFavorite': { $in: [id, '$data.favorites'] },
                  },
                },
                ...creatorInfoPipeline(),
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
  ]).exec();

  const { favorites } = result[0];

  const videos = favorites.length ? favorites[0].videos : [];
  const count = favorites.length ? favorites[0].totalCount.count : 0;

  return { videos, count };
};

export const incrementViews = (id: string) => {
  return VideoModel.updateOne({ _id: id }, { $inc: { 'data.views': 1 } });
};

export const addToHistory = async (id: string, history: History) => {
  const result = await UserModel.updateOne(
    { _id: id, 'history.video': history.video },
    { $set: { 'history.$': history } }
  );

  if (!result.modifiedCount) {
    await UserModel.updateOne({ _id: id }, { $addToSet: { history } });
  }
};

export const removeFromHistory = async (id: string, historyId: string) => {
  await UserModel.updateOne(
    { _id: id },
    { $pull: { history: { video: historyId } } }
  );
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
