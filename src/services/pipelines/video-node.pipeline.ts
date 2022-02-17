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
        let: { root: '$root' },
        as: 'root',
        pipeline: [
          { $match: { $expr: { $eq: ['$$root', '$_id'] } } },
          {
            $graphLookup: {
              from: 'videonodes',
              startWith: '$_id',
              connectFromField: '_id',
              connectToField: '_prevId',
              as: 'children',
            },
          },
        ],
      },
    },
    { $unwind: '$root' },
  ];
};
