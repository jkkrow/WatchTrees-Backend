import { Types } from 'mongoose';

export const creatorInfoPipeline = () => {
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

export const favoritesPipeline = (userId?: string) => {
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

export const historyPipeline = (userId?: string, attachData = true) => {
  return userId && attachData
    ? [
        {
          $lookup: {
            from: 'histories',
            as: 'history',
            let: { video: '$_id' },
            pipeline: [
              { $match: { user: new Types.ObjectId(userId) } },
              { $match: { $expr: { $eq: ['$$video', '$video'] } } },
            ],
          },
        },
        {
          $addFields: {
            history: {
              $cond: {
                if: { $eq: ['$history', []] },
                then: null,
                else: { $first: '$history' },
              },
            },
          },
        },
      ]
    : [];
};
