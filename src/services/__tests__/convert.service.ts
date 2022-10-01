import * as ConvertService from '../convert.service';

describe('ConvertService', () => {
  describe('createJob', () => {
    it('should be failed with invalid template', async () => {
      await expect(ConvertService.createJob({})).rejects.toThrow();
    });
  });

  describe('getJobTemplate', () => {
    it('should be failed if template not found', async () => {
      await expect(ConvertService.getJobTemplate('test')).rejects.toThrow();
    });
  });

  describe('createMetadata', () => {
    it('should return inputPath, outputPath, and jobMetadata', () => {
      const result = ConvertService.createMetadata({
        object: { key: 'test' },
        bucket: { name: 'test' },
      });

      expect(result).toHaveProperty('inputPath');
      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('jobMetadata');
    });
  });

  describe('updateJobSettings', () => {
    it('should update input, output, and metadata', () => {
      const result = ConvertService.updateJobSettings(
        {
          Settings: {
            Inputs: [{}],
            OutputGroups: [
              {
                OutputGroupSettings: {
                  Type: 'FILE_GROUP_SETTINGS',
                  FileGroupSettings: {},
                },
              },
            ],
          },
          UserMetadata: {},
          Role: 'test',
        },
        'inputPath',
        'outputPath',
        { application: 'test' }
      );

      const input = result.Settings.Inputs[0].FileInput;
      const output =
        result.Settings.OutputGroups[0].OutputGroupSettings.FileGroupSettings
          .Destination;

      expect(input).toEqual('inputPath');
      expect(output).toEqual('outputPath');
    });
  });
});
