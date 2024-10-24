const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// uploads 디렉토리 생성 확인
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

router.post("/postWrite", upload.single("files"), postController.createPost);
router.get("/postList", postController.getPosts);
router.get("/postDetail/:id", postController.getPostDetail);
router.delete("/deletePost/:id", postController.deletePost);
router.get("/editpage/:id", postController.getEditPage);
router.put("/editPost/:id", upload.single("files"), postController.editPost);
router.post("/like/:postId", postController.toggleLike);
router.get("/user-posts/:username", postController.getUserPosts);

module.exports = router;
