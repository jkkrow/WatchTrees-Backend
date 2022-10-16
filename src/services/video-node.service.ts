import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';

import { VideoNodeModel, VideoNode } from '../models/video-node';
import { VideoTreeDto } from '../models/video-tree';
import { VideoNodeDto } from '../models/video-node';
import { traverseNodes } from '../util/tree';

export const createRoot = async (userId: string) => {
  const root = {
    _id: uuidv4(),
    parentId: null,
    creator: userId,
    level: 0,
    info: null,
  };
  const node = new VideoNodeModel(root);

  return await node.save();
};

export const findByRoot = async (rootId: string, userId: string) => {
  const result = await VideoNodeModel.aggregate([
    { $match: { _id: rootId, creator: new Types.ObjectId(userId) } },
    {
      $graphLookup: {
        from: 'videonodes',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentId',
        as: 'children',
        restrictSearchWithMatch: { creator: new Types.ObjectId(userId) },
      },
    },
  ]);

  const videoNodes: VideoNode[] = result.length
    ? [result[0], ...result[0].children]
    : [];

  return videoNodes;
};

export const findByCreator = async (userId: string) => {
  return await VideoNodeModel.aggregate([
    { $match: { creator: new Types.ObjectId(userId) } },
  ]);
};

export const deleteByRoot = async (rootId: string, userId: string) => {
  const savedNodes = await findByRoot(rootId, userId);
  const deleteBulk: any[] = _getDeleteJobs(savedNodes);

  const rootNode = savedNodes.find((node) => node._id === rootId);
  await VideoNodeModel.bulkWrite(deleteBulk);

  return rootNode;
};

export const deleteByCreator = async (userId: string) => {
  const savedNodes = await findByCreator(userId);
  const deleteBulk: any[] = _getDeleteJobs(savedNodes);

  await VideoNodeModel.bulkWrite(deleteBulk);
};

export const updateNodes = async (ids: string[], updates: any) => {
  return await VideoNodeModel.updateMany(
    { _id: { $in: ids } },
    { $set: updates }
  );
};

export const updateByTree = async (newTree: VideoTreeDto, userId: string) => {
  const newNodes = traverseNodes(newTree.root);
  const savedNodes = await findByRoot(newTree.root._id, userId);

  // Node info only updated when finished uploading
  // for (let node of newNodes) {
  //   if (!node.url) continue;
  //   if (node.progress > 0 && node.progress < 100) {
  //     node.url = '';
  //   }
  // }

  // Find created nodes
  const createdNodes = newNodes.filter(
    (newNode) => !savedNodes.some((savedNode) => savedNode._id === newNode._id)
  );
  // Find deleted nodes
  const deletedNodes = savedNodes.filter(
    (savedNode) => !newNodes.some((newNode) => newNode._id === savedNode._id)
  );
  // Find updated nodes
  const updatedNodes = savedNodes.filter((savedNode) =>
    newNodes.some((newNode) => newNode._id === savedNode._id)
  );

  const bulkJobs: any[] = [];

  if (createdNodes.length) {
    bulkJobs.push(..._getInsertJobs(createdNodes, userId));
  }
  if (deletedNodes.length) {
    bulkJobs.push(..._getDeleteJobs(deletedNodes));
  }
  if (updatedNodes.length) {
    bulkJobs.push(..._getUpdateJobs(updatedNodes, newNodes));
  }

  return await VideoNodeModel.bulkWrite(bulkJobs);
};

const _getInsertJobs = (videoNodes: VideoNodeDto[], userId: string) => {
  const insertBulk = videoNodes.map((videoNode) => ({
    insertOne: {
      document: { ...videoNode, creator: new Types.ObjectId(userId) },
    },
  }));

  return insertBulk;
};

const _getDeleteJobs = (videoNodes: VideoNode[]) => {
  const deleteBulk = [
    {
      deleteMany: {
        filter: { _id: { $in: videoNodes.map((node) => node._id) } },
      },
    },
  ];

  return deleteBulk;
};

const _getUpdateJobs = (savedNodes: VideoNode[], newNodes: VideoNodeDto[]) => {
  const updateBulk: any[] = [];

  // Preserve converted videos
  savedNodes.forEach((savedNode) => {
    newNodes.forEach((newNode) => {
      const isConverted = savedNode.url.split('.')[1] === 'mpd';
      const isSameNode = newNode._id === savedNode._id;
      const isSameFile =
        newNode.name === savedNode.name && newNode.size === savedNode.size;

      if (isConverted && (isSameNode || isSameFile)) {
        newNode.url = savedNode.url;
      }
    });
  });

  // Add update job
  savedNodes.forEach((savedNode) => {
    newNodes.forEach((newNode) => {
      if (newNode._id !== savedNode._id) return;

      updateBulk.push({
        updateOne: {
          filter: { _id: savedNode._id },
          update: {
            $set: {
              name: newNode.name,
              label: newNode.label,
              size: newNode.size,
              duration: newNode.duration,
              selectionTimeStart: newNode.selectionTimeStart,
              selectionTimeEnd: newNode.selectionTimeEnd,
              url: newNode.url,
            },
          },
        },
      });
    });
  });

  return updateBulk;
};
