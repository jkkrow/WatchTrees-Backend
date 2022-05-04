import { HydratedDocument } from 'mongoose';
import { WithId } from 'mongodb';

import { connectDB, closeDB } from '../../test/db';
import * as VideoNodeService from '../video-node.service';
import * as VideoTreeService from '../video-tree.service';
import * as UserService from '../user.service';
import { VideoTree } from '../../models/video-tree';
import { User } from '../../models/user';

describe('VideoNodeService', () => {
  let user: HydratedDocument<User>;
  let tree: WithId<VideoTree>;

  beforeAll(async () => {
    await connectDB();
    user = await UserService.create(
      'native',
      'Test',
      'test@example.com',
      'password'
    );
  });
  beforeAll(async () => {
    tree = await VideoTreeService.create(user.id);
    tree.root.children = [
      {
        _id: '1',
        layer: 1,
        parentId: tree.root._id,
        info: null,
        creator: user.id,
        children: [
          {
            _id: '1-1',
            layer: 2,
            parentId: '1',
            info: null,
            creator: user.id,
            children: [],
          },
        ],
      },
      {
        _id: '2',
        layer: 1,
        parentId: tree.root._id,
        info: null,
        creator: user.id,
        children: [],
      },
    ];

    await VideoTreeService.update(tree._id.toString(), tree, user.id);
  });
  afterAll(closeDB);

  describe('createRoot', () => {
    it('should create a node', async () => {
      const node = await VideoNodeService.createRoot(user.id);
      expect(node).toBeDefined();
    });
  });

  describe('findByRoot', () => {
    it('should return all nodes which has same root', async () => {
      const nodes = await VideoNodeService.findByRoot(tree.root._id, user.id);
      expect(nodes).toHaveLength(4);
    });

    it('should only return nodes that matching creator', async () => {
      const anotherUser = await UserService.create(
        'native',
        'Test2',
        'test2@example.com',
        'password'
      );
      await VideoTreeService.create(anotherUser.id);

      const nodes = await VideoNodeService.findByRoot(tree.root._id, user.id);
      expect(nodes).toHaveLength(4);
    });
  });

  describe('deleteByRoot', () => {
    it('should delete all nodes which has same root', async () => {
      await VideoNodeService.deleteByRoot(tree.root._id, user.id);
      const nodes = await VideoNodeService.findByRoot(tree.root._id, user.id);

      expect(nodes).toHaveLength(0);
    });

    it('should only delete nodes that matching creator', async () => {
      const anotherTree = await VideoTreeService.create(user.id);
      await VideoNodeService.deleteByRoot(tree.root._id, user.id);
      const nodes = await VideoNodeService.findByRoot(
        anotherTree.root._id,
        user.id
      );

      expect(nodes).toHaveLength(1);
    });
  });

  describe('bulkWrite', () => {
    it('should insert new nodes that not existed before', async () => {
      tree.root.children = [
        {
          _id: '1',
          layer: 1,
          parentId: tree.root._id,
          info: null,
          creator: user.id,
          children: [
            {
              _id: '1-1',
              layer: 2,
              parentId: '1',
              info: null,
              creator: user.id,
              children: [],
            },
            {
              _id: '1-2',
              layer: 2,
              parentId: '1',
              info: null,
              creator: user.id,
              children: [],
            },
          ],
        },
        {
          _id: '2',
          layer: 1,
          parentId: tree.root._id,
          info: null,
          creator: user.id,
          children: [],
        },
        {
          _id: '3',
          layer: 2,
          parentId: tree.root._id,
          info: null,
          creator: user.id,
          children: [],
        },
      ];
      await VideoNodeService.bulkWrite(tree, user.id);
      const nodes = await VideoNodeService.findByRoot(tree.root._id, user.id);

      expect(nodes).toHaveLength(6);
    });

    it('should update nodes if already existed', async () => {
      tree.root.children = [
        {
          _id: '1',
          layer: 1,
          parentId: tree.root._id,
          info: {
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
          },
          creator: user.id,
          children: [
            {
              _id: '1-1',
              layer: 2,
              parentId: '1',
              info: null,
              creator: user.id,
              children: [],
            },
          ],
        },
        {
          _id: '2',
          layer: 1,
          parentId: tree.root._id,
          info: null,
          creator: user.id,
          children: [],
        },
      ];
      await VideoNodeService.bulkWrite(tree, user.id);
      const nodes = await VideoNodeService.findByRoot(tree.root._id, user.id);
      const firstChild = nodes.find((node) => node._id === '1')!;

      expect(firstChild.info).not.toBeNull();
    });

    it('should delete nodes if not existing anymore', async () => {
      tree.root.children = [
        {
          _id: '1',
          layer: 1,
          parentId: tree.root._id,
          info: null,
          creator: user.id,
          children: [],
        },
      ];
      await VideoNodeService.bulkWrite(tree, user.id);
      const nodes = await VideoNodeService.findByRoot(tree.root._id, user.id);

      expect(nodes).toHaveLength(2);
    });
  });
});
