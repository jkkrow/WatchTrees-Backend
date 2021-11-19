export interface VideoTree {
  root: string; // ref to VideoNode Document
  creator: string; // ref to User Document
  title: string;
  tags: string[];
  description: string;
  thumbnail: { name: string; url: string };
  maxDuration: number;
  minDuration: number;
  size: number;
  views: number;
  isEditing: boolean;
  status: 'public' | 'private';
}
