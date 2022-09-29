import * as VideoTreeService from '../services/video-tree.service';
import { asyncHandler } from '../util/async-handler';

export const createVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const video = await VideoTreeService.create(req.user.id);

  res.status(201).json({ video });
});

export const updateVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { uploadTree } = req.body;
  const { id } = req.params;

  await VideoTreeService.update(id, uploadTree, req.user.id);

  res.json({ message: 'Upload progress saved' });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await VideoTreeService.remove(id, req.user.id);

  res.json({ message: 'Video deleted successfully' });
});

export const getCreatedVideos = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { page, max } = req.query as { [key: string]: string };

  const { videos, count } = await VideoTreeService.findByCreator(
    req.user.id,
    page,
    max
  );

  res.json({ videos, count });
});

export const getCreatedVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  const video = await VideoTreeService.findOneByCreator(id, req.user.id);

  res.json({ video });
});

export const getFeaturedVideos = asyncHandler(async (req, res) => {
  const params = req.query as {
    page: string;
    max: string;
    userId: string;
  };

  const result = await VideoTreeService.findClientByFeatured(params);

  res.json({ videos: result.videos, count: result.count });
});

export const getClientVideos = asyncHandler(async (req, res) => {
  const params = req.query as {
    page: string;
    max: string;
    search: string;
    channelId: string;
    userId: string;
    ids: string[];
  };

  let result: any;

  if (params.search) {
    result = await VideoTreeService.findClientByKeyword(params);
  } else if (params.channelId) {
    result = await VideoTreeService.findClientByChannel(params);
  } else if (params.ids) {
    result = await VideoTreeService.findClientByIds(params);
  } else {
    result = await VideoTreeService.findClient(params);
  }

  res.json({ videos: result.videos, count: result.count });
});

export const getClientVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query as { [key: string]: string };

  await VideoTreeService.incrementViews(id);
  const video = await VideoTreeService.findClientOne(id, userId);

  res.json({ video });
});

export const getFavorites = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const params = req.query as { page: string; max: string };

  const { videos, count } = await VideoTreeService.findClientByFavorites(
    req.user.id,
    params
  );

  res.json({ videos, count });
});

export const toggleFavorites = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await VideoTreeService.updateFavorites(id, req.user.id);

  res.json({ message: 'Favorites updated' });
});
