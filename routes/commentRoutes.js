const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");

router.post("/create", commentController.createComment);
router.get("/:postId", commentController.getComments);
router.put("/:commentId", commentController.updateComment);
router.delete("/:commentId", commentController.deleteComment);

module.exports = router;
