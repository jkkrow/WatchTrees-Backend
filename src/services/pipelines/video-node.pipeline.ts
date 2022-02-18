export const rootNodePipe = () => {
  return [
    {
      $lookup: {
        from: 'videonodes',
        localField: 'root',
        foreignField: '_id',
        as: 'root',
      },
    },
    { $unwind: '$root' },
  ];
};

export const allNodesPipe = () => {
  return [
    {
      $lookup: {
        from: 'videonodes',
        let: { root: '$root', creator: '$info.creator' },
        as: 'root',
        pipeline: [
          { $match: { $expr: { $eq: ['$$root', '$_id'] } } },
          {
            $graphLookup: {
              from: 'videonodes',
              startWith: '$_id',
              connectFromField: '_id',
              connectToField: 'parentId',
              as: 'children',
              restrictSearchWithMatch: {
                $expr: { $eq: ['$creator', '$$creator'] },
              },
            },
          },
        ],
      },
    },
    { $unwind: '$root' },
  ];
};
