const Post = require("../models/Post");
const Comment = require("../models/Comment");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");

function handleFile(req) {
	try {
		if (req.file) {
			// 파일 URL 경로로 변환
			return `uploads/${req.file.filename}`;
		}
		return null;
	} catch (error) {
		console.error("파일저장에러:", error);
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
		console.error("새글 작성 에러:", error);
		res.status(500).json({
			message: "글 등록에 실패했습니다.",
			error: error.message,
		});
	}
};

exports.getPosts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 0;
		const limit = parseInt(req.query.limit) || 10;
		const skip = page * limit;

		// 전체 게시물 수 조회
		const totalPosts = await Post.countDocuments();

		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		// 각 게시물에 대한 추가 정보 조회
		const postsWithDetails = await Promise.all(
			posts.map(async (post) => {
				const commentCount = await Comment.countDocuments({
					post: post._id,
				});
				return {
					...post,
					commentCount,
					likeCount: post.likes?.length || 0,
				};
			})
		);

		// 실제로 더 불러올 데이터가 있는지 확인
		const remainingPosts = totalPosts - (skip + posts.length);
		const hasMore = remainingPosts > 0;

		console.log({
			page,
			limit,
			skip,
			totalPosts,
			loadedPosts: posts.length,
			remainingPosts,
			hasMore,
		});

		res.json({
			posts: postsWithDetails,
			page,
			hasMore,
			total: totalPosts,
			remaining: remainingPosts,
		});
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
		console.error("글수정 에러:", error);
		res.status(500).json({ message: "게시글 수정에 실패했습니다." });
	}
};

// 알림기능을 위한 코드 수정
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

			// 좋아요 추가 시에만 알림 생성
			if (post.author !== userInfo.username) {
				await Notification.create({
					recipient: post.author,
					sender: userInfo.username,
					postId,
					type: "like",
				});
			}
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
		console.error("글 작성자 정보 가져오기 에러:", error);
		res.status(500).json({ message: "서버 에러" });
	}
};
