import { HydratedDocument } from 'mongoose';

import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import * as HistoryService from '../history.service';
import * as VideoTreeService from '../video-tree.service';
import * as UserService from '../user.service';
import { HistoryDTO, HistoryModel } from '../../models/history';
import { VideoTreeDTO } from '../../models/video-tree';
import { User } from '../../models/user';

describe('HistoryService', () => {
  let user: HydratedDocument<User>;
  let tree: VideoTreeDTO;

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create('native', 'Test', testEmail, 'password');
    tree = await VideoTreeService.create(user.id);
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('find', () => {
    it('should return a videos and count', async () => {
      const result = await HistoryService.find({
        userId: user.id,
        page: 1,
        max: 10,
        skipFullyWatched: false,
      });

      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['videos', 'count'])
      );
    });

    it('should have history property in video item', async () => {
      const history: HistoryDTO = {
        tree: tree._id.toString(),
        activeNodeId: tree.root._id,
        progress: 10,
        totalProgress: 10,
        isEnded: false,
      };

      await HistoryService.put(history, user.id);
      const result = await HistoryService.find({
        userId: user.id,
        page: 1,
        max: 10,
        skipFullyWatched: false,
      });

      expect(result.videos[0]).toHaveProperty('history');
    });
  });

  describe('put', () => {
    it('should be failed if not video was found', async () => {
      const history: HistoryDTO = {
        tree: 'asdfasdfasdfasdfasdfasdf',
        activeNodeId: 'asdfasdfasdfasdf',
        progress: 10,
        totalProgress: 10,
        isEnded: false,
      };

      await expect(HistoryService.put(history, user.id)).rejects.toThrow();
    });

    it('should create a new history if not existed', async () => {
      const history: HistoryDTO = {
        tree: tree._id.toString(),
        activeNodeId: tree.root._id,
        progress: 10,
        totalProgress: 10,
        isEnded: false,
      };

      await HistoryService.put(history, user.id);
      const histories = await HistoryModel.find({});

      expect(histories).toHaveLength(1);
    });

    it('should update a history if alread existed', async () => {
      const history: HistoryDTO = {
        tree: tree._id.toString(),
        activeNodeId: tree.root._id,
        progress: 10,
        totalProgress: 10,
        isEnded: false,
      };
      await HistoryService.put(history, user.id);

      history.progress = 20;
      history.totalProgress = 20;
      await HistoryService.put(history, user.id);
      const histories = await HistoryModel.find({});

      expect(histories).toHaveLength(1);
      expect(histories[0].progress).toBe(20);
    });
  });

  describe('remove', () => {
    it('should remove a history', async () => {
      const history: HistoryDTO = {
        tree: tree._id.toString(),
        activeNodeId: tree.root._id,
        progress: 10,
        totalProgress: 10,
        isEnded: false,
      };
      await HistoryService.put(history, user.id);
      await HistoryService.remove(history.tree, user.id);
      const histories = await HistoryModel.find({});

      expect(histories).toHaveLength(0);
    });
  });
});
