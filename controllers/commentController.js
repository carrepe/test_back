const Comment = require("../models/Comment");

exports.createComment = async (req, res) => {
	const { postId, content, author } = req.body;
	try {
		const comment = await Comment.create({
			content,
			author,
			post: postId,
		});
		res.json(comment);
	} catch (error) {
		console.error("Error creating comment:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};

exports.getComments = async (req, res) => {
	try {
		const comments = await Comment.find({ post: req.params.postId }).sort({
			createdAt: -1,
		});
		res.json(comments);
	} catch (error) {
		console.error("Error fetching comments:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};

exports.updateComment = async (req, res) => {
	const { commentId } = req.params;
	const { content } = req.body;

	try {
		const comment = await Comment.findByIdAndUpdate(
			commentId,
			{ content, updatedAt: new Date() },
			{ new: true }
		);
		if (!comment) {
			return res
				.status(404)
				.json({ message: "댓글을 찾을 수 없습니다." });
		}
		res.json(comment);
	} catch (error) {
		console.error("Error updating comment:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};

exports.deleteComment = async (req, res) => {
	const { commentId } = req.params;

	try {
		const comment = await Comment.findByIdAndDelete(commentId);
		if (!comment) {
			return res
				.status(404)
				.json({ message: "댓글을 찾을 수 없습니다." });
		}
		res.json({ message: "댓글이 삭제되었습니다." });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "서버 에러" });
	}
};
