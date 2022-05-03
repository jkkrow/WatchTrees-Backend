import { connectDB, clearDB, closeDB } from '../../test/db';
import * as AuthService from '../auth.service';
import * as UserService from '../user.service';

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

    it('should be failed if there is existing email', async () => {
      await AuthService.signup('Test', 'test@example.com', 'password');
      await expect(
        AuthService.signup('Test', 'test@example.com', 'password')
      ).rejects.toThrow();
    });

    it('should hash a password', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      expect(user.password).not.toEqual('password');
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

  describe('googleSignin', () => {
    it('should only receive valid token', async () => {
      await expect(AuthService.googleSignin('123456')).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const updatedUser = await AuthService.updatePassword(
        user.id,
        'password',
        'newPassword'
      );

      expect(updatedUser.password).not.toEqual(user.password);
    });

    it('should hash password', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const updatedUser = await AuthService.updatePassword(
        user.id,
        'password',
        'newPassword'
      );

      expect(updatedUser.password).not.toEqual('newPassword');
    });
  });

  describe('sendVerification', () => {
    it('should return verification token', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const token = await AuthService.sendVerification(user.email);

      expect(token).toBeDefined();
    });

    it("should be failed if email doesn't exist", async () => {
      await expect(
        AuthService.sendVerification('test@example.com')
      ).rejects.toThrow();
    });

    it('should be failed if user already verified', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      await UserService.update(user.id, { isVerified: true });

      await expect(AuthService.sendVerification(user.email)).rejects.toThrow();
    });
  });

  describe('checkVerification', () => {
    it('should update verified status', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const token = await AuthService.sendVerification(user.email);
      const updatedUser = await AuthService.checkVerification(token);

      expect(updatedUser.isVerified).toBeTruthy();
    });

    it('should be failed if token is invalid', async () => {
      await expect(AuthService.checkVerification('asdfasdf')).rejects.toThrow();
    });
  });

  describe('sendRecovery', () => {
    it('should return a recovery token', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const token = await AuthService.sendRecovery(user.email);

      expect(token).toBeDefined();
    });

    it("should be failed if email doesn't exist", async () => {
      await expect(
        AuthService.sendRecovery('test@example.com')
      ).rejects.toThrow();
    });
  });

  describe('checkRecovery', () => {
    it('should return true', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const token = await AuthService.sendRecovery(user.email);
      const result = await AuthService.checkRecovery(token);

      expect(result).toBeTruthy();
    });

    it('should be failed if token is invalid', async () => {
      await expect(AuthService.checkRecovery('asdfasdf')).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should update password', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const token = await AuthService.sendRecovery(user.email);
      const updatedUser = await AuthService.resetPassword(token, 'newPassword');

      expect(updatedUser.password).not.toEqual(user.password);
    });

    it('should be failed if token is invalid', async () => {
      await expect(
        AuthService.resetPassword('asdfasdf', 'newPassword')
      ).rejects.toThrow();
    });

    it('should reset recovery token', async () => {
      const user = await AuthService.signup(
        'Test',
        'test@example.com',
        'password'
      );

      const token = await AuthService.sendRecovery(user.email);
      const updatedUser = await AuthService.resetPassword(token, 'newPassword');

      expect(updatedUser.recoveryToken).toBeFalsy();
    });
  });
});
