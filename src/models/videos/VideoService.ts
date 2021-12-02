import { Filter, FindOptions, WithId, ObjectId } from 'mongodb';

import { client } from '../../config/db';
import { VideoTree, VideoSchema } from './Video';

const collectionName = 'videos';

export interface VideoDocument extends WithId<VideoTree> {}

export class VideoService {
  static findById(id: string | ObjectId, options?: FindOptions) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .findOne({ _id: new ObjectId(id) }, options);
  }

  static findByCreator(userId: string, pipeline?: any) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .aggregate([
        { $match: { 'info.creator': new ObjectId(userId) } },
        ...pipeline,
      ])
      .toArray();
  }

  static findPublics(filter: Filter<VideoDocument>, pipeline?: any) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .aggregate([
        {
          $match: {
            'info.status': 'public',
            'info.isEditing': false,
            ...filter,
          },
        },
        ...pipeline,
      ])
      .toArray();
  }

  static createVideo(video: VideoTree, userId: string) {
    const newVideo = new VideoSchema(video, userId);

    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .insertOne(newVideo);
  }

  static updateVideo(video: VideoDocument) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .replaceOne(
        {
          _id: new ObjectId(video._id),
          'info.creator': new ObjectId(video.info.creator),
        },
        video
      );
  }

  static deleteVideo(videoId: string | ObjectId, creatorId: string) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .deleteOne({
        _id: new ObjectId(videoId),
        'info.creator': new ObjectId(creatorId),
      });
  }
}
