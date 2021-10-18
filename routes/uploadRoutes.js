const router = require("express").Router();

const uploadController = require("../controllers/uploadController");
const verifyToken = require("../middlewares/verify-token");

router.get("/initiate-upload", verifyToken, uploadController.initiateUpload);
router.get("/get-upload-url", verifyToken, uploadController.getUploadUrl);
router.post("/complete-upload", verifyToken, uploadController.completeUpload);
router.post("/save-upload", verifyToken, uploadController.saveUpload);

module.exports = router;
