import { Types } from 'mongoose';

export const historyPipe = (userId?: string, attachData = true) => {
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
