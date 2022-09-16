import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { connectDB, closeDB, clearDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import * as VideoNodeService from '../video-node.service';
import * as UserService from '../user.service';
import {
  VideoNodeModel,
  VideoNode,
  VideoNodeDTO,
} from '../../models/video-node';
import { User } from '../../models/user';
import { VideoTreeDTO } from '../../models/video-tree';

describe('VideoNodeService', () => {
  let user: HydratedDocument<User>;
  let root: HydratedDocument<VideoNode>;
  const createChild = async (parentId: string, userId: string) => {
    const node: VideoNodeDTO = {
      _id: uuidv4(),
      layer: 1,
      info: null,
      parentId: parentId,
      creator: userId,
      children: [],
    };
    await new VideoNodeModel(node).save();
    return node;
  };

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create('native', 'Test', testEmail, 'password');
    root = await VideoNodeService.createRoot(user.id);
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('createRoot', () => {
    it('should create a node', async () => {
      const node = await VideoNodeService.createRoot(user.id);
      expect(node).toBeDefined();
    });
  });

  describe('findByRoot', () => {
    it('should return all nodes which has same root', async () => {
      await createChild(root.id, user.id);
      await createChild(root.id, user.id);

      const nodes = await VideoNodeService.findByRoot(root.id, user.id);

      expect(nodes).toHaveLength(3);
    });

    it('should only return nodes that matching creator', async () => {
      const anotherUser = await UserService.create(
        'native',
        'Test2',
        'noreply@watchtree.net',
        'password'
      );
      await VideoNodeService.createRoot(anotherUser.id);
      const nodes = await VideoNodeService.findByRoot(root.id, user.id);

      expect(nodes).toHaveLength(1);
    });
  });

  describe('findByCreator', () => {
    it('should return all nodes which has same creator', async () => {
      const nodes = await VideoNodeService.findByCreator(user.id);

      expect(nodes).toHaveLength(1);
    });
  });

  describe('deleteByRoot', () => {
    it('should delete all nodes which has same root', async () => {
      await VideoNodeService.deleteByRoot(root.id, user.id);
      const nodes = await VideoNodeService.findByRoot(root.id, user.id);

      expect(nodes).toHaveLength(0);
    });

    it('should only delete nodes that matching creator', async () => {
      const anotherRoot = await VideoNodeService.createRoot(user.id);
      await VideoNodeService.deleteByRoot(root.id, user.id);
      const nodes = await VideoNodeService.findByRoot(anotherRoot.id, user.id);

      expect(nodes).toHaveLength(1);
    });
  });

  describe('deleteByCreator', () => {
    it('should delete all nodes which has same creator', async () => {
      await VideoNodeService.deleteByCreator(user.id);
      const nodes = await VideoNodeService.findByCreator(user.id);

      expect(nodes).toHaveLength(0);
    });
  });

  describe('updateByTree', () => {
    it('should insert new nodes that not existed before', async () => {
      const child1 = await createChild(root.id, user.id);
      const child2 = await createChild(root.id, user.id);
      const tree: VideoTreeDTO = {
        _id: 'asdfasdfasdfasdfasdfasdf',
        root: {
          _id: root.id,
          parentId: root.parentId,
          layer: root.layer,
          creator: root.creator.toString(),
          info: root.info,
          children: [child1, child2],
        },
        info: {} as any,
        data: {} as any,
      };

      await VideoNodeService.updateByTree(tree, user.id);
      const nodes = await VideoNodeService.findByRoot(root.id, user.id);

      expect(nodes).toHaveLength(3);
    });

    it('should update nodes if already existed', async () => {
      const child1 = await createChild(root.id, user.id);
      const child2 = await createChild(root.id, user.id);
      const tree: VideoTreeDTO = {
        _id: 'asdfasdfasdfasdfasdfasdf',
        root: {
          _id: root.id,
          parentId: root.parentId,
          layer: root.layer,
          creator: root.creator.toString(),
          info: root.info,
          children: [child1, child2],
        },
        info: {} as any,
        data: {} as any,
      };
      await VideoNodeService.updateByTree(tree, user.id);

      tree.root.children[0].info = {
        name: 'Test name',
        label: 'Test label',
        url: 'test.mp4',
        size: 100,
        duration: 30,
        isConverted: false,
        selectionTimeStart: 20,
        selectionTimeEnd: 30,
        progress: 100,
        error: null,
      };

      await VideoNodeService.updateByTree(tree, user.id);

      const nodes = await VideoNodeService.findByRoot(root.id, user.id);
      const firstChild = nodes.find((node) => node._id === child1._id)!;

      expect(firstChild.info).not.toBeNull();
    });

    it('should delete nodes if not existing anymore', async () => {
      const child1 = await createChild(root.id, user.id);
      const child2 = await createChild(root.id, user.id);
      const tree: VideoTreeDTO = {
        _id: 'asdfasdfasdfasdfasdfasdf',
        root: {
          _id: root.id,
          parentId: root.parentId,
          layer: root.layer,
          creator: root.creator.toString(),
          info: root.info,
          children: [child1, child2],
        },
        info: {} as any,
        data: {} as any,
      };

      await VideoNodeService.updateByTree(tree, user.id);

      tree.root.children.pop();
      await VideoNodeService.updateByTree(tree, user.id);

      const nodes = await VideoNodeService.findByRoot(root.id, user.id);

      expect(nodes).toHaveLength(2);
    });
  });
});
