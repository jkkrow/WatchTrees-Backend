import { ObjectId } from 'mongodb';

export interface NodeInfo {
  name: string;
  label: string;
  size: number;
  duration: number;
  selectionTimeStart: number | null;
  selectionTimeEnd: number | null;
  error: string | null;
  progress: number;
  isConverted: boolean;
  url: string;
}

export interface VideoNode {
  id: string;
  prevId?: string;
  layer: number;
  info: NodeInfo | null;
  children: VideoNode[];
}

export interface TreeInfo {
  creator: ObjectId; // ref to User Document
  title: string;
  tags: string[];
  description: string;
  thumbnail: { name: string; url: string };
  size: number;
  maxDuration: number;
  minDuration: number;
  status: 'public' | 'private';
  isEditing: boolean;
}

export interface TreeData {
  views: number;
  favorites: ObjectId[]; // ref to User Document;
}

export interface VideoTree {
  root: VideoNode;
  info: TreeInfo;
  data: TreeData;
  createdAt: Date;
}

export class VideoSchema implements VideoTree {
  public root: VideoNode;
  public info: TreeInfo;
  public data: TreeData;
  public createdAt = new Date();

  constructor(video: VideoTree, userId: string) {
    this.root = video.root;
    this.info = video.info;
    this.info.creator = new ObjectId(userId);
    this.data = { views: 0, favorites: [] };
  }
}
