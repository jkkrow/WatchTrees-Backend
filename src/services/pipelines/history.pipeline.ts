import { Types } from 'mongoose';

export const historyPipe = (userId?: string, attachData = true) => {
  return userId && attachData
    ? [
        {
          $lookup: {
            from: 'histories',
            as: 'history',
            let: { tree: '$_id' },
            pipeline: [
              { $match: { user: new Types.ObjectId(userId) } },
              { $match: { $expr: { $eq: ['$$tree', '$tree'] } } },
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
