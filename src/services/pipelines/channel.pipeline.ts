import { Types } from 'mongoose';

export const channelPipeline = (userId?: string) => [
  {
    $lookup: {
      from: 'videotrees',
      as: 'videos',
      let: { id: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$$id', '$info.creator'] },
            'info.isEditing': false,
            'info.status': 'public',
          },
        },
      ],
    },
  },
  {
    $addFields: {
      videos: { $size: '$videos' },
      subscribers: { $size: '$subscribers' },
      isSubscribed: userId
        ? { $in: [new Types.ObjectId(userId), '$subscribers'] }
        : false,
    },
  },
  {
    $project: {
      name: 1,
      picture: 1,
      videos: 1,
      subscribers: 1,
      isSubscribed: 1,
    },
  },
];
