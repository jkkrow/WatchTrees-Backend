import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import * as EmailService from '../email.service';

describe('EmailService', () => {
  const options = {
    from: 'test',
    to: testEmail,
    subject: 'Test',
    message: 'testing',
  };

  beforeAll(connectDB);
  afterEach(clearDB);
  afterAll(closeDB);

  describe('createBounce', () => {
    it('should create bounce', async () => {
      const result = await EmailService.createBounce(
        testEmail,
        'HardBounce',
        'outbound',
        new Date().toString()
      );

      expect(result).toHaveProperty('_id');
    });
  });

  describe('checkBounce', () => {
    it('should throw error if bounce is found', async () => {
      await EmailService.createBounce(
        testEmail,
        'HardBounce',
        'outbound',
        new Date().toString()
      );

      await expect(EmailService.checkBounce(testEmail)).rejects.toThrow();
    });
  });

  describe('sendEmail', () => {
    it('should be failed if email is boucned', async () => {
      await EmailService.createBounce(
        testEmail,
        'HardBounce',
        'outbound',
        new Date().toString()
      );

      await expect(EmailService.sendEmail(options)).rejects.toThrow();
    });

    it('should send email via email provider', async () => {
      const response = await EmailService.sendEmail(options);

      expect(response.ErrorCode).toBeFalsy();
    });
  });
});
