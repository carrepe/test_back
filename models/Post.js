const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema(
	{
		// postid: String,
		title: String,
		summary: String,
		content: String,
		cover: String,
		author: String,
		createdAt: Date,
		updatedAt: Date,
		likes: [{ type: Schema.Types.ObjectId, ref: "User" }], // 새로 추가된 필드
	}
	//   {
	//     timestamps: true, // createdAt, updatedAt 자동으로 생성
	//   }
	// { versionKey: false }
	// __v 필드 생성하지 않음
	// 이 필드는 MongoDB 문서가 얼마나 많이 수정되었는지를 추적합니다.
);

// 시간의 기준은 UTC로 설정됨
// UTC + 9시간을 더해주어야 한국 시간이 됨

// 한국 시간이 저장되도록 설정
PostSchema.pre("save", function (next) {
	const currentDate = new Date();
	currentDate.setHours(currentDate.getHours() + 9); // KST is UTC +9
	// currentDate.setHours(currentDate.getHours());

	this.updatedAt = currentDate;

	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

const PostModel = model("Post", PostSchema);

module.exports = PostModel;
