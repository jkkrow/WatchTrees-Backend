import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { connectDB, closeDB } from '../../test/db';
import * as VideoTreeService from '../video-tree.service';
import * as UserService from '../user.service';
import { VideoTreeModel } from '../../models/video-tree';
import { User } from '../../models/user';
import { traverseNodes } from '../../util/tree';

describe('VideoTreeService', () => {
  let user: HydratedDocument<User>;

  beforeAll(async () => {
    await connectDB();
    user = await UserService.create(
      'native',
      'Test',
      'test@example.com',
      'password'
    );
  });
  afterAll(closeDB);

  describe('create', () => {
    it('should create a new tree', async () => {
      const tree = await VideoTreeService.create(user.id);

      expect(tree).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update tree info', async () => {
      const tree = await VideoTreeService.create(user.id);
      tree.info.title = 'Testing';

      const updatedTree = await VideoTreeService.update(
        tree._id.toString(),
        tree,
        user.id
      );

      expect(updatedTree.info.title).toBe('Testing');
    });

    it('should NOT update tree data', async () => {
      const tree = await VideoTreeService.create(user.id);
      tree.data.views = 100;

      const updatedTree = await VideoTreeService.update(
        tree._id.toString(),
        tree,
        user.id
      );

      expect(updatedTree.data.views).not.toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('should remove a tree item', async () => {
      const newTree = await VideoTreeService.create(user.id);
      await VideoTreeService.remove(newTree._id.toString(), user.id);

      await expect(
        VideoTreeService.findOne(newTree._id.toString())
      ).rejects.toThrow();
    });

    it('should be failed if user id not matched', async () => {
      const newTree = await VideoTreeService.create(user.id);

      await expect(
        VideoTreeService.remove(newTree._id.toString(), 'asdfasdf')
      ).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return all child nodes', async () => {
      const newTree = await VideoTreeService.create(user.id);
      const newId = uuidv4();
      newTree.root.children = [
        {
          _id: newId,
          layer: 1,
          parentId: newTree.root._id,
          info: null,
          creator: user.id,
          children: [
            {
              _id: uuidv4(),
              layer: 2,
              parentId: newId,
              info: null,
              creator: user.id,
              children: [],
            },
          ],
        },
        {
          _id: uuidv4(),
          layer: 1,
          parentId: newTree.root._id,
          info: null,
          creator: user.id,
          children: [],
        },
      ];

      await VideoTreeService.update(newTree._id.toString(), newTree, user.id);
      const fetchedTree = await VideoTreeService.findOne(
        newTree._id.toString()
      );
      const fetchedNodes = traverseNodes(fetchedTree.root);

      expect(fetchedNodes).toHaveLength(4);
    });

    it('should only return nodes that matching creator', async () => {
      const newUser = await UserService.create(
        'native',
        'Test2',
        'test2@example.com',
        'password'
      );

      const tree1 = await VideoTreeService.create(user.id);
      const tree2 = await VideoTreeService.create(newUser.id);
      tree1.root.children = [
        {
          _id: uuidv4(),
          layer: 1,
          parentId: tree1.root._id,
          info: null,
          creator: user.id,
          children: [],
        },
      ];

      await VideoTreeService.update(tree1._id.toString(), tree1, user.id);
      const fetchedTree = await VideoTreeService.findOne(tree2._id.toString());

      expect(fetchedTree.root.children).toHaveLength(0);
    });
  });

  describe('findClientOne', () => {
    it('should have creatorInfo, favorites, and history properties', async () => {
      const tree = await VideoTreeService.create(user.id);
      const fetchedTree = await VideoTreeService.findClientOne(
        tree._id.toString(),
        user.id
      );

      expect(fetchedTree).toHaveProperty('history');
      expect(fetchedTree).toHaveProperty(['info', 'creatorInfo']);
      expect(fetchedTree).toHaveProperty(['data', 'isFavorite']);
    });

    it('should be failed if is private and fetched by other than creator', async () => {
      const tree = await VideoTreeService.create(user.id);
      tree.info.status = 'private';

      await VideoTreeService.update(tree._id.toString(), tree, user.id);

      await expect(
        VideoTreeService.findClientOne(tree._id.toString())
      ).rejects.toThrow();
    });
  });

  describe('findOneByCreator', () => {
    it('should be failed if creator not matched', async () => {
      const tree = await VideoTreeService.create(user.id);
      const anotherUser = await UserService.create(
        'native',
        'Another',
        'another@test.com',
        'password'
      );

      await expect(
        VideoTreeService.findOneByCreator(tree._id.toString(), anotherUser.id)
      ).rejects.toThrow();
    });
  });

  describe('find', () => {
    it('should return videos and count', async () => {
      const result = await VideoTreeService.find({});

      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['videos', 'count'])
      );
    });

    it('should have creatorInfo, favorites, and history properties', async () => {
      await VideoTreeService.create(user.id);
      const result = await VideoTreeService.find({});
      const fetchedTree = result.videos[0];

      expect(fetchedTree).toHaveProperty('history');
      expect(fetchedTree).toHaveProperty(['info', 'creatorInfo']);
      expect(fetchedTree).toHaveProperty(['data', 'isFavorite']);
    });
  });

  describe('findByCreator', () => {
    it('should have null value in history property', async () => {
      await VideoTreeService.create(user.id);
      const result = await VideoTreeService.find({});
      const fetchedTree = result.videos[0];

      expect(fetchedTree.history).toBeNull();
    });
  });

  describe('findClient', () => {
    it('should not fetch editing videos', async () => {
      await VideoTreeService.create(user.id);
      const result = await VideoTreeService.findClient({ page: 1, max: 10 });

      expect(result.videos).toHaveLength(0);
    });
  });

  describe('updateFavorites', () => {
    it('should add user to favorites if not exists', async () => {
      const tree = await VideoTreeService.create(user.id);

      await VideoTreeService.updateFavorites(tree._id.toString(), user.id);
      const fetchedTree = await VideoTreeService.findOne(tree._id.toString());

      expect(fetchedTree.data.favorites).toHaveLength(1);
    });

    it('should remove user from favorites if already exists', async () => {
      const tree = await VideoTreeService.create(user.id);

      await VideoTreeService.updateFavorites(tree._id.toString(), user.id);
      await VideoTreeService.updateFavorites(tree._id.toString(), user.id);
      const fetchedTree = await VideoTreeService.findOne(tree._id.toString());

      expect(fetchedTree.data.favorites).toHaveLength(0);
    });
  });

  describe('deleteByCreator', () => {
    it('should mark as deleted for every videos that user created', async () => {
      const tree1 = await VideoTreeService.create(user.id);
      const tree2 = await VideoTreeService.create(user.id);

      await VideoTreeService.deleteByCreator(user.id);

      const deletedTree1 = await VideoTreeModel.findById(tree1._id);
      const deletedTree2 = await VideoTreeModel.findById(tree2._id);

      expect(deletedTree1!.deleted).toBeTruthy();
      expect(deletedTree2!.deleted).toBeTruthy();
    });
  });
});
