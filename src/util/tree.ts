import { VideoTree } from '../models/video-tree';
import { VideoNode, NodeInfo } from '../models/video-node';

export const findNodeById = (tree: VideoTree, id: string): VideoNode | null => {
  let currentNode: VideoNode = tree.root;
  const queue: VideoNode[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    if (currentNode._id === id) return currentNode;

    if (currentNode.children.length)
      currentNode.children.forEach((child) => queue.push(child));
  }

  return null;
};

export const traverseNodes = (root: VideoNode): VideoNode[] => {
  let currentNode = root;
  const queue: VideoNode[] = [];
  const nodes: VideoNode[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    nodes.push(currentNode);

    if (currentNode.children.length)
      currentNode.children.forEach((child) => queue.push(child));
  }

  return nodes;
};

export const validateNodes = (
  root: VideoNode,
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

export const buildTree = (nodes: VideoNode[]): VideoTree => {
  const map: any = {};
  let root: any = {};

  nodes.forEach((node, index) => {
    map[node._id] = index;
    nodes[index].children = [];
  });

  nodes.forEach((node, index) => {
    node = nodes[index];

    if (node._prevId) {
      nodes[map[node._prevId]].children.push(node);
    } else {
      root = node;
    }
  });

  return root;
};
