import { Types } from 'mongoose';

import * as VideoNodeService from './video-node.service';
import { VideoTreeModel, VideoTree } from '../models/video-tree';
import { HttpError } from '../models/error';
import { traverseNodes, validateNodes } from '../util/tree';

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
