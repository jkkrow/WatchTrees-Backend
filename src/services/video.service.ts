import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { VideoModel, VideoTree } from '../models/video';
import {
  creatorInfoPipeline,
  favoritesPipeline,
  historyPipeline,
} from './pipelines/video.pipeline';
import { HttpError } from '../models/error';
import { traverseNodes, findNodeById, validateNodes } from '../util/tree';

export const create = async (currentUserId: string) => {
  const videoTree = {
    root: {
      id: uuidv4(),
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

export const findOne = async (id: string) => {
  const video = await VideoModel.findById(id);

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  return video;
};

export const findClientOne = async (id: string, currentUserId?: string) => {
  const result = await VideoModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...creatorInfoPipeline(),
    ...favoritesPipeline(currentUserId),
    ...historyPipeline(currentUserId),
  ]);

  if (!result.length) {
    throw new HttpError(404, 'Video not found');
  }

  const video = result[0];

  if (
    video.info.status === 'private' &&
    video.info.creator.toString() !== currentUserId
  ) {
    throw new HttpError(403, 'Not authorized to video');
  }

  return video;
};

export const find = async ({
  match = {},
  sort = {},
  page = 1,
  max = 12,
  currentUserId,
  historyData = true,
}: {
  match?: any;
  sort?: any;
  page?: number | string;
  max?: number | string;
  currentUserId?: string;
  historyData?: boolean;
}) => {
  const result = await VideoModel.aggregate([
    { $match: { ...match } },
    {
      $facet: {
        videos: [
          { $sort: { ...sort, _id: -1 } },
          { $skip: +max * (+page - 1) },
          { $limit: +max },
          { $project: { 'root.children': 0 } },
          ...creatorInfoPipeline(),
          ...favoritesPipeline(currentUserId),
          ...historyPipeline(currentUserId, historyData),
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

export const findByCreator = async (
  creatorId: string,
  page: number | string,
  max: number | string
) => {
  return await find({
    match: { 'info.creator': new Types.ObjectId(creatorId) },
    page,
    max,
    historyData: false,
  });
};

export const findClient = async ({
  match = {},
  sort = {},
  page,
  max,
  currentUserId,
}: {
  match?: any;
  sort?: any;
  page: number | string;
  max: number | string;
  currentUserId?: string;
}) => {
  return await find({
    match: { 'info.status': 'public', 'info.isEditing': false, ...match },
    sort,
    page,
    max,
    currentUserId,
  });
};

export const findClientByKeyword = async (params: {
  search: string;
  page: number | string;
  max: number | string;
  currentUserId?: string;
}) => {
  return await findClient({
    match: { $text: { $search: params.search } },
    sort: { score: { $meta: 'textScore' } },
    ...params,
  });
};

export const findClientByChannel = async (params: {
  channelId: string;
  page: number | string;
  max: number | string;
  currentUserId?: string;
}) => {
  return await findClient({
    match: { 'info.creator': new Types.ObjectId(params.channelId) },
    ...params,
  });
};

export const findClientByIds = async (params: {
  ids: string[];
  currentUserId?: string;
}) => {
  return await findClient({
    match: { _id: { $in: params.ids.map((id) => new Types.ObjectId(id)) } },
    page: 1,
    max: params.ids.length,
    currentUserId: params.currentUserId,
  });
};

export const findClientByFavorites = async (
  id: string,
  params: { page: number | string; max: number | string }
) => {
  return await findClient({
    match: { $expr: { $in: [new Types.ObjectId(id), '$data.favorites'] } },
    currentUserId: id,
    ...params,
  });
};

export const updateFavorites = async (id: string, currentUserId: string) => {
  const objectUserId = new Types.ObjectId(currentUserId);
  return await VideoModel.updateOne({ _id: id }, [
    {
      $set: {
        'data.favorites': {
          $cond: [
            { $in: [objectUserId, '$data.favorites'] },
            { $setDifference: ['$data.favorites', [objectUserId]] },
            { $concatArrays: ['$data.favorites', [objectUserId]] },
          ],
        },
      },
    },
  ]);
};

export const incrementViews = async (id: string) => {
  return await VideoModel.updateOne({ _id: id }, { $inc: { 'data.views': 1 } });
};
