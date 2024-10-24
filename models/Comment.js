const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
	content: { type: String, required: true },
	author: { type: String, required: true },
	post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
	createdAt: Date,
	updatedAt: Date,
});

CommentSchema.pre("save", function (next) {
	const currentDate = new Date();
	currentDate.setHours(currentDate.getHours() + 9); // KST is UTC +9

	this.updatedAt = currentDate;

	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
