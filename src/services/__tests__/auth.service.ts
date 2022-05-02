import { connectDB, clearDB, closeDB } from '../../test/db';
import * as AuthService from '../auth.service';

jest.mock('../../util/send-email.ts');

describe('AuthService', () => {
  beforeAll(connectDB);
  afterEach(clearDB);
  afterAll(closeDB);

  describe('signup', () => {
    it('should create a new user', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      expect(user).toHaveProperty('_id');
    });

    it('should failed if there is existing email', async () => {
      await AuthService.signup('Test', 'test@example.com', 'password');
      await expect(
        AuthService.signup('Test', 'test@example.com', 'password')
      ).rejects.toThrow();
    });
  });

  describe('signin', () => {
    it('should sign in a user', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      await expect(
        AuthService.signin(user.email, 'password')
      ).resolves.not.toThrow();
    });
  });

  describe('google-signin', () => {
    it('should only receive valid token', async () => {
      await expect(AuthService.googleSignin('123456')).rejects.toThrow();
    });
  });
});
