const router = require("express").Router();

const videoController = require("../controllers/videoController");

router.get("/", videoController.getVideo);

module.exports = router;
