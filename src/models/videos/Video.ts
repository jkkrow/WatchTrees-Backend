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

export interface VideoTree {
  root: VideoNode;
  info: {
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
  };
  data: {
    views: number;
    favorites: number;
  };
}
