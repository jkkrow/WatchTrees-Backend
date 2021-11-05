export interface Node {
  id: string;
  prevId?: string;
  layer: number;
  info: any;
  children: Node[];
}

export interface Tree {
  root: Node;
}

export const findById = (tree: Tree, id: string): Node | null => {
  let currentNode: Node = tree.root;
  const queue: Node[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    if (currentNode.id === id) return currentNode;

    if (currentNode.children.length)
      currentNode.children.forEach((child) => queue.push(child));
  }

  return null;
};

export const traverseNodes = (root: Node): Node[] => {
  let currentNode = root;
  const queue: Node[] = [];
  const nodes: Node[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    nodes.push(currentNode);

    if (currentNode.children.length)
      currentNode.children.forEach((child) => queue.push(child));
  }

  return nodes;
};
