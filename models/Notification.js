const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
	// recipient: 알림을 받을 사용자의 username을 저장
	// String 타입이며 필수 필드로 지정(required: true)
	recipient: { type: String, required: true },

	// sender: 알림을 발생시킨 사용자의 username을 저장
	// String 타입이며 필수 필드로 지정(required: true)
	sender: { type: String, required: true },

	// postId: 알림이 발생한 게시글의 ObjectId를 저장
	// mongoose.Schema.Types.ObjectId 타입으로 Post 모델을 참조(ref)
	// 필수 필드로 지정(required: true)
	postId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		required: true,
	},

	// type: 알림의 종류를 저장 (댓글 또는 좋아요)
	// String 타입이며 enum으로 "comment"와 "like" 값만 허용
	// 특정 값들로만 제한하고 싶을 때 사용하는 데이터 타입
	// enum에 지정되지 않은 값을 저장하려고 하면 Mongoose는 검증 에러를 발생시킵니다:
	// 필수 필드로 지정(required: true)
	type: { type: String, enum: ["comment", "like"], required: true },

	// isRead: 알림 읽음 여부를 저장
	// Boolean 타입이며 기본값은 false로 지정
	isRead: { type: Boolean, default: false },

	createdAt: Date,
	updatedAt: Date,
});

// 한국 시간이 저장되도록 설정
notificationSchema.pre("save", function (next) {
	const currentDate = new Date();
	currentDate.setHours(currentDate.getHours() + 9);

	this.updatedAt = currentDate;
	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

module.exports = mongoose.model("Notification", notificationSchema);
