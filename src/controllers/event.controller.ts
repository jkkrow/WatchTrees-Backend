import * as AuthService from '../services/auth.service';
import * as EmailService from '../services/email.service';
import * as VideoTreeService from '../services/video-tree.service';
import * as UploadService from '../services/upload.service';
import * as HistoryService from '../services/history.service';
import * as PaymentService from '../services/payment.service';
import { asyncHandler } from '../util/async-handler';
import { UserDocument } from '../models/user';
import { VideoTreeDocument } from '../models/video-tree';

export const userCreateEventHandler = asyncHandler(async (req, res) => {
  const user: UserDocument = req.body.detail.fullDocument;

  await AuthService.sendVerification(user.email);

  res.json({ message: 'Webhook triggered successfully' });
});

export const userDeleteEventHandler = asyncHandler(async (req, res) => {
  const user: UserDocument = req.body.detail.fullDocumentBeforeChange;

  const videoPath = `videos/${user._id}/`;
  const imagePath = `images/${user._id}/`;

  await Promise.all([
    VideoTreeService.deleteByCreator(user._id.toString()),
    HistoryService.deleteByUser(user._id.toString()),
    UploadService.deleteDirectory(videoPath),
    UploadService.deleteDirectory(imagePath),
  ]);

  if (user.premium && !user.premium.isCancelled) {
    await PaymentService.cancelSubscription(user.premium.id);
  }

  await EmailService.sendEmailWithTemplate({
    from: 'noreply',
    to: user.email,
    templateAlias: 'account-deletion',
    templateModel: {},
  });

  res.json({ message: 'Webhook triggered successfully' });
});

export const videoTreeDeleteEventHandler = asyncHandler(async (req, res) => {
  const videoTree: VideoTreeDocument = req.body.detail.fullDocumentBeforeChange;

  const path = `videos/${videoTree.info.creator}/${videoTree._id}/`;

  await Promise.all([
    HistoryService.deleteByVideoTree(videoTree._id.toString()),
    UploadService.deleteDirectory(path),
  ]);

  res.json({ message: 'Webhook triggered successfully' });
});
