import { VideoTreeDto } from '../models/video-tree';
import { VideoNode, VideoNodeDto } from '../models/video-node';

export const findNodeById = <T extends VideoTreeDto>(
  tree: T,
  id: string
): T['root'] | null => {
  let currentNode: T['root'] = tree.root;
  const queue: T['root'][] = [];

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

export const traverseNodes = <T extends VideoNodeDto>(root: T): T[] => {
  let currentNode = root;
  const queue: T[] = [];
  const nodes: T[] = [];

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

export const validateNodes = <T extends VideoNodeDto>(
  root: T,
  key: keyof T,
  value: any,
  type = true
): boolean => {
  const nodes = traverseNodes(root);

  return !!nodes.find((node) => {
    return type ? node[key] === value : node[key] !== value;
  });
};

export const buildTree = <T extends VideoNode>(nodes: T[]): VideoNodeDto => {
  const map: any = {};
  let root: VideoNodeDto = {
    _id: '',
    parentId: null,
    level: 0,
    name: '',
    label: '',
    url: '',
    size: 0,
    duration: 0,
    selectionTimeStart: 0,
    selectionTimeEnd: 0,
    children: [],
  };

  const nodeDtos: VideoNodeDto[] = nodes.map((node, index) => {
    map[node._id] = index;
    return {
      _id: node._id,
      parentId: node.parentId,
      level: node.level,
      name: node.name,
      label: node.label,
      url: node.url,
      size: node.size,
      duration: node.duration,
      selectionTimeStart: node.selectionTimeStart,
      selectionTimeEnd: node.selectionTimeEnd,
      children: [],
    };
  });

  nodeDtos.forEach((node) => {
    if (node.parentId) {
      nodeDtos[map[node.parentId]].children.push(node);
    } else {
      root = node;
    }
  });

  return root;
};
