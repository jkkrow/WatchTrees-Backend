import { Types } from 'mongoose';

import * as VideoNodeService from './video-node.service';
import {
  VideoTreeModel,
  VideoTreeDocument,
  VideoTreeDto,
  VideoTreeClient,
} from '../models/video-tree';
import { HttpError } from '../models/error';
import { historyPipe } from './pipelines/history.pipeline';
import { allNodesPipe, rootNodePipe } from './pipelines/video-node.pipeline';
import { creatorInfoPipe, favoritePipe } from './pipelines/video-tree.pipeline';
import { validateNodes, buildTree } from '../util/tree';

export const create = async (userId: string): Promise<VideoTreeDto> => {
  const root = await VideoNodeService.createRoot(userId);

  const videoTree = new VideoTreeModel({
    root: root._id,
    creator: userId,
  });

  await videoTree.save();

  const videoTreeDto: VideoTreeDto = {
    _id: videoTree.id,
    root: {
      _id: root.id,
      level: root.level,
      parentId: root.parentId,
      name: root.name,
      label: root.label,
      duration: root.duration,
      url: root.url,
      size: root.size,
      selectionTimeStart: root.selectionTimeStart,
      selectionTimeEnd: root.selectionTimeEnd,
      children: [],
    },
    title: videoTree.title,
    tags: videoTree.tags,
    description: videoTree.description,
    size: videoTree.size,
    maxDuration: videoTree.maxDuration,
    minDuration: videoTree.minDuration,
    thumbnail: videoTree.thumbnail,
    isEditing: videoTree.isEditing,
    status: videoTree.status,
    views: videoTree.views,
    favorites: videoTree.favorites,
    createdAt: videoTree.createdAt,
    updatedAt: videoTree.updatedAt,
  };

  return videoTreeDto;
};

export const update = async (
  id: string,
  newTree: VideoTreeDto,
  userId: string
): Promise<VideoTreeDocument> => {
  const videoTree = await VideoTreeModel.findById(id);

  if (!videoTree) {
    throw new HttpError(404, 'Video not found');
  }

  if (userId !== videoTree.creator.toString()) {
    throw new HttpError(403);
  }

  // Update Nodes
  await VideoNodeService.updateByTree(newTree, userId);

  // Update Tree *UpdateVideoTreeDto*
  videoTree.title = newTree.title;
  videoTree.tags = newTree.tags;
  videoTree.description = newTree.description;
  videoTree.size = newTree.size;
  videoTree.maxDuration = newTree.maxDuration;
  videoTree.minDuration = newTree.minDuration;
  videoTree.thumbnail = newTree.thumbnail;
  videoTree.isEditing = newTree.isEditing;
  videoTree.status = newTree.status;

  if (!videoTree.title || validateNodes(newTree.root, 'url', '')) {
    videoTree.isEditing = true;
  }

  return await videoTree.save();
};

export const remove = async (
  id: string,
  userId: string
): Promise<VideoTreeDocument> => {
  const video = await VideoTreeModel.findById(id);

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  if (userId !== video.creator.toString()) {
    throw new HttpError(403, 'Not authorized to remove video');
  }

  await VideoNodeService.deleteByRoot(video.root, userId);

  return await video.remove();
};

export const findById = async (
  id: string
): Promise<VideoTreeDocument | null> => {
  return await VideoTreeModel.findById(id);
};

export const findOne = async (id: string): Promise<VideoTreeDto> => {
  const result = await VideoTreeModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...allNodesPipe(),
  ]);

  if (!result.length) {
    throw new HttpError(404, 'Video not found');
  }

  const videoTreeWithNodeList = result[0];
  const root = buildTree([
    videoTreeWithNodeList.root,
    ...videoTreeWithNodeList.root.children,
  ]);
  const videoTreeDto: VideoTreeDto = { ...videoTreeWithNodeList, root };

  return videoTreeDto;
};

export const findClientOne = async (
  id: string,
  userId?: string
): Promise<VideoTreeClient> => {
  const result = await VideoTreeModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...allNodesPipe(),
    ...creatorInfoPipe(),
    ...favoritePipe(userId),
    ...historyPipe(userId),
  ]);

  if (!result.length) {
    throw new HttpError(404, 'Video not found');
  }

  const videoTreeWithNodeList = result[0];
  const root = buildTree([
    videoTreeWithNodeList.root,
    ...videoTreeWithNodeList.root.children,
  ]);
  const videoTreeDto: VideoTreeClient = { ...videoTreeWithNodeList, root };

  if (
    videoTreeDto.status === 'private' &&
    userId !== videoTreeDto.creator._id
  ) {
    throw new HttpError(403, 'Not authorized to video');
  }

  return videoTreeDto;
};

export const findOneByCreator = async (id: string, userId: string) => {
  const result = await VideoTreeModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },
    ...allNodesPipe(),
  ]);

  if (!result.length) {
    throw new HttpError(404, 'Video not found');
  }

  if (userId !== result[0].creator.toString()) {
    throw new HttpError(403, 'Not authorized to this video');
  }

  const videoTreeWithNodeList = result[0];
  const root = buildTree([
    videoTreeWithNodeList.root,
    ...videoTreeWithNodeList.root.children,
  ]);
  const videoTreeDto: VideoTreeDto = { ...videoTreeWithNodeList, root };

  return videoTreeDto;
};

export const find = async ({
  match = {},
  sort,
  page = 1,
  max = 12,
  userId,
  historyData = true,
}: {
  match?: any;
  sort?: any;
  page?: number | string;
  max?: number | string;
  userId?: string;
  historyData?: boolean;
}): Promise<{
  videos: VideoTreeClient[];
  count: number;
}> => {
  const result = await VideoTreeModel.aggregate([
    { $match: match },
    {
      $facet: {
        videos: [
          { $sort: sort || { _id: -1 } },
          { $skip: +max * (+page - 1) },
          { $limit: +max },
          ...rootNodePipe(),
          ...creatorInfoPipe(),
          ...favoritePipe(userId),
          ...historyPipe(userId, historyData),
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
    match: { creator: new Types.ObjectId(creatorId) },
    page,
    max,
    historyData: false,
  });
};

export const findClient = async ({
  match = {},
  sort,
  page,
  max,
  userId,
}: {
  match?: any;
  sort?: any;
  page: number | string;
  max: number | string;
  userId?: string;
}) => {
  return await find({
    match: {
      status: 'public',
      isEditing: false,
      ...match,
    },
    sort,
    page,
    max,
    userId,
  });
};

export const findClientByFeatured = async (params: {
  page: number | string;
  max: number | string;
}) => {
  return await findClient({
    sort: { updatedAt: -1 },
    ...params,
  });
};

export const findClientByKeyword = async (params: {
  search: string;
  page: number | string;
  max: number | string;
  userId?: string;
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
  userId?: string;
}) => {
  return await findClient({
    match: { creator: new Types.ObjectId(params.channelId) },
    ...params,
  });
};

export const findClientByIds = async (params: {
  ids: string[];
  userId?: string;
}) => {
  return await findClient({
    match: { _id: { $in: params.ids.map((id) => new Types.ObjectId(id)) } },
    page: 1,
    max: params.ids.length,
    userId: params.userId,
  });
};

export const findClientByFavorites = async (
  id: string,
  params: { page: number | string; max: number | string }
) => {
  return await findClient({
    match: { $expr: { $in: [new Types.ObjectId(id), '$favorites'] } },
    userId: id,
    ...params,
  });
};

export const updateFavorites = async (id: string, userId: string) => {
  const objectUserId = new Types.ObjectId(userId);
  return await VideoTreeModel.updateOne({ _id: id }, [
    {
      $set: {
        favorites: {
          $cond: [
            { $in: [objectUserId, '$favorites'] },
            { $setDifference: ['$favorites', [objectUserId]] },
            { $concatArrays: ['$favorites', [objectUserId]] },
          ],
        },
      },
    },
  ]);
};

export const incrementViews = async (id: string) => {
  return await VideoTreeModel.updateOne({ _id: id }, { $inc: { views: 1 } });
};

export const deleteByCreator = async (userId: string) => {
  await VideoTreeModel.deleteMany({ creator: userId });
  await VideoNodeService.deleteByCreator(userId);
};
