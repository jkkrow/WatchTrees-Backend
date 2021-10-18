const AWS = require("aws-sdk");

const User = require("../models/data/User");
const Video = require("../models/data/Video");

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_BUCKET_REGION,
});

exports.initiateUpload = async (req, res, next) => {
  try {
    const { treeId, fileName, fileType } = req.query;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      ContentType: fileType,
    };

    const uploadData = await s3.createMultipartUpload(params).promise();

    res.json({ uploadId: uploadData.UploadId });
  } catch (err) {
    return next(err);
  }
};

exports.getUploadUrl = async (req, res, next) => {
  try {
    const { uploadId, partNumber, treeId, fileName } = req.query;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId,
      PartNumber: partNumber,
    };

    const presignedUrl = await s3.getSignedUrlPromise("uploadPart", params);

    res.json({ presignedUrl });
  } catch (err) {
    return next(err);
  }
};

exports.completeUpload = async (req, res, next) => {
  try {
    const { uploadId, parts, treeId, fileName } = req.body.params;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    };

    const result = await s3.completeMultipartUpload(params).promise();

    res.json({ url: result.Location });
  } catch (err) {
    return next(err);
  }
};

exports.saveUpload = async (req, res, next) => {
  try {
    const { tree } = req.body;

    const user = await User.findById(req.user.id).populate("videos");

    let video = user.videos.find((item) => item.root.id === tree.root.id);

    if (!video) {
      video = new Video(tree);
      user.videos.push(video);
    } else {
      video.root = tree.root;
      video.status = "Progressing";
    }

    await Promise.all([user.save(), video.save()]);

    res.json({ message: "Saved video successfully." });
  } catch (err) {
    return next(err);
  }
};

exports.cancelUpload = async (req, res, next) => {
  try {
    const { treeId, fileName, uploadId } = req.query;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `videos/${req.user.id}/${treeId}/${fileName}`,
      UploadId: uploadId,
    };

    const data = await s3.abortMultipartUpload(params).promise();

    res.json({ data });
  } catch (err) {
    return next(err);
  }
};
