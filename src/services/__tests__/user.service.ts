import { connectDB, clearDB, closeDB } from '../../test/db';
import * as UserService from '../user.service';

describe('UserService', () => {
  beforeAll(connectDB);
  afterEach(clearDB);
  afterAll(closeDB);

  describe('findById', () => {
    it('should have a form of ObjectId', async () => {
      await expect(UserService.findById('asdfasfasf')).rejects.toThrow();
    });

    it('should be failed if there is no user', async () => {
      const user = await UserService.create(
        'native',
        'Test',
        'test@example.com',
        'password'
      );
      await UserService.remove(user.id);

      await expect(UserService.findById(user.id)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a user by filter', async () => {
      const result = await UserService.findOne({ email: 'test@example.com' });

      expect(result).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const result = await UserService.create(
        'native',
        'Test',
        'test@example.com',
        'password'
      );

      expect(result).toHaveProperty('_id');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = await UserService.create(
        'native',
        'Test',
        'test@example.com',
        'password'
      );

      const updatedUser = await UserService.update(user.id, { name: 'New' });

      expect(updatedUser.name).toBe('New');
    });
  });
});
