const Comment = require("../models/Comment");
// 알림 설정을 위한 추가 코드
const Notification = require("../models/Notification");
const Post = require("../models/Post");

exports.createComment = async (req, res) => {
	const { postId, content, author } = req.body;
	try {
		const comment = await Comment.create({
			content,
			author,
			post: postId,
		});

		// 게시글 작성자 찾기
		const post = await Post.findById(postId);
		if (post && post.author !== author) {
			// 본인의 게시글이 아닐 경우에만 알림 생성
			await Notification.create({
				recipient: post.author,
				sender: author,
				postId,
				type: "comment",
			});
		}

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
