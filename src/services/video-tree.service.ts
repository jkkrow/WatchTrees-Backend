import { Types } from 'mongoose';

import * as VideoNodeService from './video-node.service';
import { VideoTreeModel, VideoTree } from '../models/video-tree';
import { HttpError } from '../models/error';
import { historyPipe } from './pipelines/history.pipeline';
import { allNodesPipe, rootNodePipe } from './pipelines/video-node.pipeline';
import { creatorInfoPipe, favoritePipe } from './pipelines/video-tree.pipeline';
import { traverseNodes, validateNodes, buildTree } from '../util/tree';

export const create = async (currentUserId: string) => {
  const root = await VideoNodeService.createRoot();
  const info = {
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
  };
  const data = {
    views: 0,
    favorites: [],
  };

  const videoTreeModel = new VideoTreeModel({ root: root._id, info, data });
  await videoTreeModel.save();

  return {
    _id: videoTreeModel._id,
    root: {
      _id: root._id,
      layer: root.layer,
      info: root.info,
      children: [],
    },
    info,
    data,
  };
};

export const update = async (id: string, uploadTree: VideoTree) => {
  const videoTree = await VideoTreeModel.findById(id);

  if (!videoTree) {
    throw new HttpError(404, 'Video not found');
  }
  if (
    uploadTree.info.creator.toString() !== videoTree.info.creator.toString()
  ) {
    throw new HttpError(403);
  }

  // Refactor Tree
  const nodes = traverseNodes(uploadTree.root);
  for (let node of nodes) {
    if (!node.info) continue;
    if (node.info.progress > 0 && node.info.progress < 100) {
      node.info = null;
    }
  }

  // Update Nodes
  await VideoNodeService.bulkWrite(uploadTree);

  // Update Tree
  videoTree.info = uploadTree.info;

  if (!videoTree.info.title || validateNodes(uploadTree.root, 'info')) {
    videoTree.info.isEditing = true;
  }

  return await videoTree.save();
};

export const remove = async (id: string, currentUserId: string) => {
  const video = await VideoTreeModel.findById(id);

  if (!video) return;
  if (video.info.creator.toString() !== currentUserId) {
    throw new HttpError(403, 'Not authorized to remove video');
  }

  await VideoNodeService.deleteByRoot(video.root);

  return await video.remove();
};

export const findOne = async (id: string) => {
  const result = await VideoTreeModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...allNodesPipe(),
  ]);

  if (!result.length) {
    throw new HttpError(404, 'Video not found');
  }

  const video = result[0];
  video.root = buildTree([video.root, ...video.root.children]);

  return video;
};

export const findClientOne = async (id: string, currentUserId?: string) => {
  const result = await VideoTreeModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...allNodesPipe(),
    ...creatorInfoPipe(),
    ...favoritePipe(currentUserId),
    ...historyPipe(currentUserId),
  ]);

  if (!result.length) {
    throw new HttpError(404, 'Video not found');
  }

  const video = result[0];
  video.root = buildTree([video.root, ...video.root.children]);

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
  const result = await VideoTreeModel.aggregate([
    { $match: { ...match } },
    {
      $facet: {
        videos: [
          { $sort: { ...sort, _id: -1 } },
          { $skip: +max * (+page - 1) },
          { $limit: +max },
          ...rootNodePipe(),
          ...creatorInfoPipe(),
          ...favoritePipe(currentUserId),
          ...historyPipe(currentUserId, historyData),
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
  return await VideoTreeModel.updateOne({ _id: id }, [
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
  return await VideoTreeModel.updateOne(
    { _id: id },
    { $inc: { 'data.views': 1 } }
  );
};
