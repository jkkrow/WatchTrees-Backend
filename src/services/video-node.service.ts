import { v4 as uuidv4 } from 'uuid';

import { VideoNodeModel, VideoNode } from '../models/video-node';
import { VideoTree } from '../models/video-tree';
import { traverseNodes } from '../util/tree';

export const createRoot = async () => {
  const root = { _id: uuidv4(), layer: 0, info: null };
  const node = new VideoNodeModel(root);

  return await node.save();
};

export const getInsertJob = (videoNodes: VideoNode[]) => {
  const insertBulk = videoNodes.map((videoNode) => ({
    insertOne: { document: videoNode },
  }));

  return insertBulk;
};

export const getDeleteJob = (videoNodes: any[]) => {
  const deleteBulk = [
    {
      deleteMany: {
        filter: { _id: { $in: videoNodes.map((videoNode) => videoNode._id) } },
      },
    },
  ];

  return deleteBulk;
};

export const getUpdateJob = (existingNodes: any[], newNodes: VideoNode[]) => {
  const updateBulk: any[] = [];

  for (let existingNode of existingNodes) {
    const newNode = newNodes.find(
      (newNode) => newNode._id === existingNode._id
    );

    if (!newNode) continue;
    if (newNode.info && existingNode.info) {
      newNode.info.isConverted = existingNode.info.isConverted;
      newNode.info.url = existingNode.info.url;
    }

    updateBulk.push({
      updateOne: {
        filter: { _id: existingNode._id },
        update: { info: newNode.info },
      },
    });
  }

  return updateBulk;
};

export const bulkWrite = async (uploadTree: VideoTree) => {
  const uploadNodes = traverseNodes(uploadTree.root);
  const savedNodes = await findFromRoot(uploadTree.root._id);

  // Find created nodes
  const createdNodes = uploadNodes.filter(
    (uploadNode) =>
      !savedNodes.some((savedNode) => savedNode._id === uploadNode._id)
  );

  // Find deleted nodes
  const deletedNodes = savedNodes.filter(
    (savedNode) =>
      !uploadNodes.some((uploadNode) => uploadNode._id === savedNode._id)
  );

  // Find updated nodes
  const updatedNodes = savedNodes.filter((savedNode) =>
    uploadNodes.some((uploadNode) => uploadNode._id === savedNode._id)
  );

  const bulkJobs: any[] = [];

  if (createdNodes.length) {
    bulkJobs.push(...getInsertJob(createdNodes));
  }

  if (deletedNodes.length) {
    bulkJobs.push(...getDeleteJob(deletedNodes));
  }

  if (updatedNodes.length) {
    bulkJobs.push(...getUpdateJob(updatedNodes, uploadNodes));
  }

  return await VideoNodeModel.bulkWrite(bulkJobs);
};

export const findFromRoot = async (rootId: string) => {
  const result = await VideoNodeModel.aggregate([
    { $match: { _id: rootId } },
    {
      $graphLookup: {
        from: 'videonodes',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: '_prevId',
        as: 'children',
      },
    },
  ]);

  return result.length ? [result[0], ...result[0].children] : [];
};
