export interface Video {
  name: string;
  url: string;
  size: number;
  duration: number;
  isConverted: boolean;
}

export interface VideoNode {
  id: string;
  prevId?: string;
  treeId: string; // ref to VideoTree Document
  video: Video;
  layer: number;
  label: string;
  selectionTimeStart: number | null;
  selectionTimeEnd: number | null;
  error: string | null;
  progress: number;
  children: string[]; // ref to VideoNode Document
}
