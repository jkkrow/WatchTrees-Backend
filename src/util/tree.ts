import { VideoTreeDTO } from '../models/video-tree';
import { VideoNode, VideoNodeDTO, NodeInfo } from '../models/video-node';

export const findNodeById = (
  tree: VideoTreeDTO,
  id: string
): VideoNodeDTO | null => {
  let currentNode: VideoNodeDTO = tree.root;
  const queue: VideoNodeDTO[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    if (currentNode._id === id) {
      return currentNode;
    }

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return null;
};

export const traverseNodes = (root: VideoNodeDTO): VideoNodeDTO[] => {
  let currentNode = root;
  const queue: VideoNodeDTO[] = [];
  const nodes: VideoNodeDTO[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    nodes.push(currentNode);

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return nodes;
};

export const validateNodes = (
  root: VideoNodeDTO,
  key: keyof NodeInfo | 'info',
  value: any = null,
  type = true
): boolean => {
  const nodes = traverseNodes(root);

  if (key === 'info') {
    return !!nodes.find((node) =>
      type ? node.info === value : node.info !== value
    );
  }

  return !!nodes.find((node) => {
    if (!node.info) return false;
    return type ? node.info[key] === value : node.info[key] !== value;
  });
};

export const buildTree = (nodes: VideoNode[]): VideoNodeDTO => {
  const map: any = {};
  let root: VideoNodeDTO = {
    _id: '',
    parentId: null,
    layer: 0,
    info: null,
    creator: '',
    children: [],
  };

  const nodeDTOs: VideoNodeDTO[] = nodes.map((node, index) => {
    map[node._id] = index;
    const nodeDTO = { ...node, creator: node.creator.toString(), children: [] };
    return nodeDTO;
  });

  nodeDTOs.forEach((node) => {
    if (node.parentId) {
      nodeDTOs[map[node.parentId]].children.push(node);
    } else {
      root = node;
    }
  });

  return root;
};
