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
            from: 'users',
            as: 'history',
            let: { id: '$_id' },
            pipeline: [
              { $match: { _id: new Types.ObjectId(userId) } },
              {
                $project: {
                  history: {
                    $filter: {
                      input: '$history',
                      as: 'item',
                      cond: { $eq: ['$$item.video', '$$id'] },
                    },
                  },
                },
              },
              { $project: { history: { $arrayElemAt: ['$history', 0] } } },
            ],
          },
        },
        { $unwind: '$history' },
        { $addFields: { history: '$history.history' } },
        { $project: { history: { _id: 0, history: 0 } } },
        {
          $addFields: {
            history: {
              $cond: {
                if: { $eq: ['$history', {}] },
                then: null,
                else: '$history',
              },
            },
          },
        },
      ]
    : [];
};
