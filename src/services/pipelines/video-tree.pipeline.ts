import { Types } from 'mongoose';

export const creatorInfoPipe = () => {
  return [
    {
      $lookup: {
        from: 'users',
        as: 'creator',
        let: { creator: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$$creator', '$_id'] } } },
          { $project: { name: 1, picture: 1 } },
        ],
      },
    },
    { $unwind: '$creator' },
  ];
};

export const favoritePipe = (userId?: string) => {
  return [
    {
      $addFields: {
        favorites: { $size: '$favorites' },
        isFavorite: userId
          ? { $in: [new Types.ObjectId(userId), '$favorites'] }
          : false,
      },
    },
  ];
};
