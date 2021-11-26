import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { S3 } from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
import { parse } from 'path';

import { HttpError } from '../models/error/HttpError';
import { UserService } from '../models/users/UserService';

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_BUCKET_REGION!,
});

// export const fetchHistory: RequestHandler = async (req, res, next) => {
//   if (!req.user) return;

//   try {
//     const { page, max } = req.query;

//     let count: number;
//     const itemsPerPage = max ? +max : 10;
//     const pageNumber = page ? +page : 1;

//     const user = await UserService.findById(req.user.id);

//     if (!user) {
//       throw new HttpError(404, 'No user found.');
//     }

//     count = user.videos.length;

//     await user.populate({
//       path: 'history',
//       options: {
//         sort: { $natural: -1 },
//         select: '-root.children -__v',
//         limit: itemsPerPage,
//         skip: itemsPerPage * (pageNumber - 1),
//       },
//     });

//     res.json({ videos: user.videos, count });
//   } catch (err) {
//     return next(err);
//   }
// };

export const updateUserName: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { name } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    await UserService.updateUser(req.user.id, { $set: { name } });

    res.json({ message: 'User name updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { currentPassword, newPassword } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new HttpError(422, 'Invalid inputs.');
    }

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404);
    }

    const correctPassword = await UserService.checkPassword(
      user,
      currentPassword
    );

    if (!correctPassword) {
      throw new HttpError(422, 'Invalid password.');
    }

    await UserService.updateUser(req.user.id, {
      $set: { password: newPassword },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

export const updatePicture: RequestHandler = async (req, res, next) => {
  if (!req.user) return;

  try {
    const { isNewFile, fileType } = req.body;

    const user = await UserService.findById(req.user.id);

    if (!user) {
      throw new HttpError(404);
    }

    let presignedUrl = '';
    let newPicture = '';

    if (isNewFile) {
      const { dir, name } = parse(fileType);

      if (dir !== 'image') {
        throw new HttpError(422, 'Invalid file type');
      }

      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture || `images/${req.user.id}/${uuidv1()}.${name}`,
        ContentType: fileType,
      };

      presignedUrl = await s3.getSignedUrlPromise('putObject', params);

      await UserService.updateUser(req.user.id, {
        $set: { picture: params.Key },
      });

      newPicture = params.Key;
    }

    if (!isNewFile && user.picture) {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: user.picture,
      };

      await s3.deleteObject(params).promise();

      await UserService.updateUser(req.user.id, {
        $set: { picture: '' },
      });
    }

    res.json({
      presignedUrl,
      newPicture,
      message: 'Picture updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
};
