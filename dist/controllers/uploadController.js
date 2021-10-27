"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelUpload = exports.saveUpload = exports.completeUpload = exports.getUploadUrl = exports.initiateUpload = void 0;
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var User_model_1 = __importDefault(require("models/data/User.model"));
var Video_model_1 = __importDefault(require("models/data/Video.model"));
var tree_1 = require("util/tree");
var s3 = new aws_sdk_1.default.S3({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    region: process.env.S3_BUCKET_REGION,
});
var initiateUpload = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, treeId, fileName, fileType, params, uploadData, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!req.user)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                _a = req.query, treeId = _a.treeId, fileName = _a.fileName, fileType = _a.fileType;
                params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: "videos/" + req.user.id + "/" + treeId + "/" + fileName,
                    ContentType: fileType,
                };
                return [4 /*yield*/, s3.createMultipartUpload(params).promise()];
            case 2:
                uploadData = _b.sent();
                res.json({ uploadId: uploadData.UploadId });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _b.sent();
                return [2 /*return*/, next(err_1)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.initiateUpload = initiateUpload;
var getUploadUrl = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, uploadId, partNumber, treeId, fileName, params, presignedUrl, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!req.user)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                _a = req.query, uploadId = _a.uploadId, partNumber = _a.partNumber, treeId = _a.treeId, fileName = _a.fileName;
                params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: "videos/" + req.user.id + "/" + treeId + "/" + fileName,
                    UploadId: uploadId,
                    PartNumber: partNumber,
                };
                return [4 /*yield*/, s3.getSignedUrlPromise('uploadPart', params)];
            case 2:
                presignedUrl = _b.sent();
                res.json({ presignedUrl: presignedUrl });
                return [3 /*break*/, 4];
            case 3:
                err_2 = _b.sent();
                return [2 /*return*/, next(err_2)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUploadUrl = getUploadUrl;
var completeUpload = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, uploadId, parts, treeId, fileName, params, result, err_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!req.user)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                _a = req.body.params, uploadId = _a.uploadId, parts = _a.parts, treeId = _a.treeId, fileName = _a.fileName;
                params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: "videos/" + req.user.id + "/" + treeId + "/" + fileName,
                    UploadId: uploadId,
                    MultipartUpload: { Parts: parts },
                };
                return [4 /*yield*/, s3.completeMultipartUpload(params).promise()];
            case 2:
                result = _b.sent();
                res.json({ url: result.Location });
                return [3 /*break*/, 4];
            case 3:
                err_3 = _b.sent();
                return [2 /*return*/, next(err_3)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.completeUpload = completeUpload;
var saveUpload = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var savedTree_1, user, nodes, video, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.user)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                savedTree_1 = req.body.savedTree;
                return [4 /*yield*/, User_model_1.default.findById(req.user.id).populate('videos')];
            case 2:
                user = _a.sent();
                if (!user)
                    return [2 /*return*/];
                nodes = (0, tree_1.traverseNodes)(savedTree_1.root);
                nodes.forEach(function (node) {
                    if (node.info && node.info.progress > 0 && node.info.progress < 100) {
                        node.info = null;
                    }
                });
                video = user.videos.find(function (item) { return item.root.id === savedTree_1.root.id; });
                if (!video) {
                    video = new Video_model_1.default(savedTree_1);
                    user.videos.push(video);
                }
                else {
                    video.root = savedTree_1.root;
                    video.title = savedTree_1.title;
                    video.description = savedTree_1.description;
                    video.tags = savedTree_1.tags;
                    video.size = savedTree_1.size;
                    video.maxDuration = savedTree_1.maxDuration;
                    video.minDuration = savedTree_1.minDuration;
                    video.status = savedTree_1.status;
                }
                return [4 /*yield*/, Promise.all([user.save(), video.save()])];
            case 3:
                _a.sent();
                res.json({ message: 'Saved video successfully.' });
                return [3 /*break*/, 5];
            case 4:
                err_4 = _a.sent();
                return [2 /*return*/, next(err_4)];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.saveUpload = saveUpload;
var cancelUpload = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, treeId, fileName, uploadId, params, data, err_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!req.user)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                _a = req.query, treeId = _a.treeId, fileName = _a.fileName, uploadId = _a.uploadId;
                params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: "videos/" + req.user.id + "/" + treeId + "/" + fileName,
                    UploadId: uploadId,
                };
                return [4 /*yield*/, s3.abortMultipartUpload(params).promise()];
            case 2:
                data = _b.sent();
                res.json({ data: data });
                return [3 /*break*/, 4];
            case 3:
                err_5 = _b.sent();
                return [2 /*return*/, next(err_5)];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.cancelUpload = cancelUpload;
