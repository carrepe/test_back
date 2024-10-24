const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/");
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname +
				"-" +
				uniqueSuffix +
				path.extname(file.originalname)
		);
	},
});

const upload = multer({ storage: storage });

router.post("/postWrite", upload.single("files"), postController.createPost);
router.get("/postList", postController.getPosts);
router.get("/postDetail/:id", postController.getPostDetail);
router.delete("/deletePost/:id", postController.deletePost);
router.get("/editpage/:id", postController.getEditPage);
router.put("/editPost/:id", upload.single("files"), postController.editPost);
router.post("/like/:postId", postController.toggleLike);
router.get("/user-posts/:username", postController.getUserPosts);

module.exports = router;
