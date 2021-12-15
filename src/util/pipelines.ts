import { ObjectId } from 'mongodb';

export const attachCreatorInfo = () => {
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

export const attachHistory = (userId: ObjectId) => {
  return userId
    ? [
        {
          $lookup: {
            from: 'users',
            as: 'history',
            let: { id: '$_id' },
            pipeline: [
              { $match: { _id: userId } },
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
        {
          $addFields: {
            history: {
              progress: '$history.history.progress',
              updatedAt: '$history.history.updatedAt',
            },
          },
        },
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
