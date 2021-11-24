import {
  CountDocumentsOptions,
  Filter,
  FindOptions,
  WithId,
  ObjectId,
} from 'mongodb';

import { db } from '../../config/db';
import { VideoTree } from './Video';

const collectionName = 'videos';

export interface VideoDocument extends WithId<VideoTree> {}

export class VideoService {
  static findById(id: string | ObjectId, options?: FindOptions) {
    console.log(id);

    return db
      .collection<VideoDocument>(collectionName)
      .findOne({ _id: new ObjectId(id) }, options);
  }

  static findByCreator(userId: string, options?: FindOptions) {
    return db
      .collection<VideoDocument>(collectionName)
      .find({ creator: new ObjectId(userId) }, options);
  }

  static findPublics(filter?: Filter<WithId<VideoDocument>>) {
    return db
      .collection<VideoDocument>(collectionName)
      .find({ status: 'public', isEditing: false, ...filter });
  }

  static countVideos(
    filter?: Filter<VideoDocument>,
    options?: CountDocumentsOptions
  ) {
    return db
      .collection<VideoDocument>(collectionName)
      .countDocuments({ ...filter }, { ...options });
  }

  static createVideo(video: VideoDocument) {
    return db.collection<VideoDocument>(collectionName).insertOne(video);
  }

  static updateVideo(video: VideoDocument) {
    return db
      .collection<VideoDocument>(collectionName)
      .replaceOne({ _id: new ObjectId(video._id) }, video);
  }

  static deleteVideo(videoId: string | ObjectId, creatorId: string) {
    return db
      .collection<VideoDocument>(collectionName)
      .deleteOne({ _id: new ObjectId(videoId), creator: creatorId });
  }
}
