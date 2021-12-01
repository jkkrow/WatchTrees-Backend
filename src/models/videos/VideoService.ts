import {
  CountDocumentsOptions,
  Filter,
  FindOptions,
  WithId,
  ObjectId,
} from 'mongodb';

import { client } from '../../config/db';
import { VideoTree } from './Video';

const collectionName = 'videos';

export interface VideoDocument extends WithId<VideoTree> {}

export class VideoService {
  static findById(id: string | ObjectId, options?: FindOptions) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .findOne({ _id: new ObjectId(id) }, options);
  }

  static findByCreator(userId: string, options?: FindOptions) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .find({ 'info.creator': new ObjectId(userId) }, options)
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

  static countVideos(
    filter?: Filter<VideoDocument>,
    options?: CountDocumentsOptions
  ) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .countDocuments({ ...filter }, { ...options });
  }

  static createVideo(video: VideoDocument) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .insertOne(video);
  }

  static updateVideo(video: VideoDocument) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .replaceOne({ _id: new ObjectId(video._id) }, video);
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
