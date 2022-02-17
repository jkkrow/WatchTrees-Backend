import { Types } from 'mongoose';

export const creatorInfoPipe = () => {
  return [
    {
      $lookup: {
        from: 'users',
        as: 'info.creatorInfo',
        let: { creator: '$info.creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$$creator', '$_id'] } } },
          { $project: { _id: 0, name: 1, picture: 1 } },
        ],
      },
    },
    { $unwind: '$info.creatorInfo' },
  ];
};

export const favoritePipe = (userId?: string) => {
  return [
    {
      $addFields: {
        'data.favorites': { $size: '$data.favorites' },
        'data.isFavorite': userId
          ? { $in: [new Types.ObjectId(userId), '$data.favorites'] }
          : false,
      },
    },
  ];
};
