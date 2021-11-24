import { VideoTree, VideoNode, VideoInfo } from '../models/videos/Video';

export const findById = (tree: VideoTree, id: string): VideoNode | null => {
  let currentNode: VideoNode = tree.root;
  const queue: VideoNode[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    if (currentNode.id === id) return currentNode;

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
  key: keyof VideoInfo | 'info',
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
