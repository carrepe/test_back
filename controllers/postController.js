const Post = require("../models/Post");
const Comment = require("../models/Comment");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

function handleFile(req) {
	if (req.file) {
		const { filename, path: filePath } = req.file;
		const newPath = filePath + path.extname(req.file.originalname);
		fs.renameSync(filePath, newPath);
		return newPath;
	}
	return null;
}

exports.createPost = async (req, res) => {
	const newPath = handleFile(req);
	const { token } = req.cookies;
	jwt.verify(token, process.env.SECRET_KEY, {}, async (err, info) => {
		if (err) throw err;
		const { title, summary, content } = req.body;
		const postDoc = await Post.create({
			title,
			summary,
			content,
			cover: newPath,
			author: info.username,
		});
		res.json(postDoc);
	});
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
	const newPath = handleFile(req);
	const { token } = req.cookies;
	if (!token) {
		return res.status(401).json({ message: "인증 토큰이 없습니다." });
	}
	jwt.verify(token, process.env.SECRET_KEY, {}, async (err, info) => {
		if (err) throw err;
		const { title, summary, content } = req.body;
		const postDoc = await Post.findById(req.params.id);
		await Post.findByIdAndUpdate(req.params.id, {
			title,
			summary,
			content,
			cover: newPath ? newPath : postDoc.cover,
		});
		res.json({ message: "ok" });
	});
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
