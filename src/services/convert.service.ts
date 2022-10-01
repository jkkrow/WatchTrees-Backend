import path from 'path';

import { MediaConvert } from '../config/aws';
import {
  APPLICATION_NAME,
  AWS_MEDIACONVERT_ROLE,
  AWS_S3_BUCKET_MEDIA,
} from '../config/env';
import { HttpError } from '../models/error';

export const createJob = async (template: any) => {
  return await MediaConvert.createJob(template).promise();
};

export const getJobTemplate = async (name: string) => {
  const params = {
    Name: name,
  };

  const { JobTemplate } = await MediaConvert.getJobTemplate(params).promise();

  if (!JobTemplate) {
    throw new HttpError(404, 'No job template found');
  }

  return JobTemplate;
};

export const createMetadata = (detail: any) => {
  const sourceKey = detail.object.key.replace(/\+/g, ' ');
  const sourceBucket = detail.bucket.name;
  const destinationBucket = AWS_S3_BUCKET_MEDIA;

  const { dir, base, name } = path.parse(sourceKey);
  const inputPath = `s3://${sourceBucket}/${sourceKey}`;
  const outputPath = `s3://${destinationBucket}/${dir}/${name}/`;
  const jobMetadata = {
    application: APPLICATION_NAME,
    key: `${dir}/${name}/${name}`,
    fileName: base,
    treeId: sourceKey.split('/')[2],
  };

  return { inputPath, outputPath, jobMetadata };
};

export const updateJobSettings = (
  template: any,
  inputPath: string,
  outputPath: string,
  metadata: any
) => {
  const updatedTemplate = {
    Settings: template.Settings,
    UserMetadata: metadata,
    Role: AWS_MEDIACONVERT_ROLE,
  };

  updatedTemplate.Settings.Inputs[0].FileInput = inputPath;

  for (let group of updatedTemplate.Settings.OutputGroups) {
    switch (group.OutputGroupSettings.Type) {
      case 'FILE_GROUP_SETTINGS':
        group.OutputGroupSettings.FileGroupSettings.Destination = outputPath;
        break;
      case 'HLS_GROUP_SETTINGS':
        group.OutputGroupSettings.HlsGroupSettings.Destination = outputPath;
        break;
      case 'DASH_ISO_GROUP_SETTINGS':
        group.OutputGroupSettings.DashIsoGroupSettings.Destination = outputPath;
        break;
      case 'MS_SMOOTH_GROUP_SETTINGS':
        group.OutputGroupSettings.MsSmoothGroupSettings.Destination =
          outputPath;
        break;
      case 'CMAF_GROUP_SETTINGS':
        group.OutputGroupSettings.CmafGroupSettings.Destination = outputPath;
        break;
      default:
        throw new HttpError(500, 'Invalid OutputGroupSettings.');
    }
  }

  return updatedTemplate;
};
