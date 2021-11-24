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
      .find({ creator: new ObjectId(userId) }, options)
      .toArray();
  }

  static findPublics(filter?: Filter<VideoDocument>, options?: FindOptions) {
    return client
      .db()
      .collection<VideoDocument>(collectionName)
      .find({ status: 'public', isEditing: false, ...filter }, options)
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
        creator: new ObjectId(creatorId),
      });
  }
}
