export interface VideoInfo {
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
  info: VideoInfo | null;
  children: VideoNode[];
}

export interface VideoTree {
  creator: string; // ref to User Document
  root: VideoNode;
  title: string;
  tags: string[];
  description: string;
  thumbnail: { name: string; url: string };
  size: number;
  maxDuration: number;
  minDuration: number;
  views: number;
  isEditing: boolean;
  status: 'public' | 'private';
}
