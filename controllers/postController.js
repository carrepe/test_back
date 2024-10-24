const Post = require("../models/Post");
const Comment = require("../models/Comment");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

function handleFile(req) {
	try {
		if (req.file) {
			// 파일 URL 경로로 변환
			return `/uploads/${req.file.filename}`;
		}
		return null;
	} catch (error) {
		console.error("File handling error:", error);
		throw error;
	}
}

exports.createPost = async (req, res) => {
	try {
		const { token } = req.cookies;
		if (!token) {
			return res.status(401).json({ message: "인증이 필요합니다." });
		}

		const fileUrl = handleFile(req);

		const info = await new Promise((resolve, reject) => {
			jwt.verify(token, process.env.SECRET_KEY, {}, (err, decoded) => {
				if (err) reject(err);
				resolve(decoded);
			});
		});

		const { title, summary, content } = req.body;
		const postDoc = await Post.create({
			title,
			summary,
			content,
			cover: fileUrl,
			author: info.username,
		});

		res.json(postDoc);
	} catch (error) {
		console.error("Create post error:", error);
		res.status(500).json({
			message: "글 등록에 실패했습니다.",
			error: error.message,
		});
	}
};

exports.getPosts = async (req, res) => {
	try {
		const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
		const postsWithDetails = await Promise.all(
			posts.map(async (post) => {
				const commentCount = await Comment.countDocuments({
					post: post._id,
				});
				return {
					...post.toObject(),
					commentCount,
					likeCount: post.likes.length,
				};
			})
		);
		res.json(postsWithDetails);
	} catch (error) {
		console.error("Error fetching posts:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};

exports.getPostDetail = async (req, res) => {
	const { id } = req.params;
	const postDoc = await Post.findById(id);
	res.json(postDoc);
};

exports.deletePost = async (req, res) => {
	const { id } = req.params;
	await Post.findByIdAndDelete(id);
	res.json({ message: "ok" });
};

exports.getEditPage = async (req, res) => {
	const { id } = req.params;
	const postDoc = await Post.findById(id);
	res.json(postDoc);
};

exports.editPost = async (req, res) => {
	try {
		const fileUrl = handleFile(req);
		const { token } = req.cookies;
		if (!token) {
			return res.status(401).json({ message: "인증 토큰이 없습니다." });
		}

		const info = await new Promise((resolve, reject) => {
			jwt.verify(token, process.env.SECRET_KEY, {}, (err, decoded) => {
				if (err) reject(err);
				resolve(decoded);
			});
		});

		const { title, summary, content } = req.body;
		const postDoc = await Post.findById(req.params.id);

		if (!postDoc) {
			return res
				.status(404)
				.json({ message: "게시글을 찾을 수 없습니다." });
		}

		const updatedPost = await Post.findByIdAndUpdate(
			req.params.id,
			{
				title,
				summary,
				content,
				cover: fileUrl ? fileUrl : postDoc.cover,
			},
			{ new: true }
		);

		res.json(updatedPost);
	} catch (error) {
		console.error("Edit post error:", error);
		res.status(500).json({ message: "게시글 수정에 실패했습니다." });
	}
};

exports.toggleLike = async (req, res) => {
	const { postId } = req.params;
	const { token } = req.cookies;

	if (!token) {
		return res.status(401).json({ message: "인증이 필요합니다." });
	}

	try {
		const userInfo = jwt.verify(token, process.env.SECRET_KEY);
		const post = await Post.findById(postId);

		if (!post) {
			return res
				.status(404)
				.json({ message: "게시물을 찾을 수 없습니다." });
		}

		const userIdStr = userInfo.id.toString();
		const likeIndex = post.likes.indexOf(userIdStr);

		if (likeIndex > -1) {
			post.likes.splice(likeIndex, 1);
		} else {
			post.likes.push(userIdStr);
		}

		await post.save();
		res.json(post);
	} catch (error) {
		console.error("토글 기능 오류:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};

exports.getUserPosts = async (req, res) => {
	const { username } = req.params;
	try {
		const posts = await Post.find({ author: username })
			.sort({ createdAt: -1 })
			.lean();

		const postsWithDetails = await Promise.all(
			posts.map(async (post) => {
				const commentCount = await Comment.countDocuments({
					post: post._id,
				});
				return {
					...post,
					commentCount,
					likeCount: post.likes.length,
				};
			})
		);

		res.json(postsWithDetails);
	} catch (error) {
		console.error("Error fetching user posts:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};
