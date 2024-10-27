const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
	// 참여자 배열을 문자열로 결합한 고유 식별자
	chatId: {
		type: String,
		required: true,
		unique: true,
	},
	participants: {
		type: [String],
		required: true,
		validate: [
			{
				validator: function (arr) {
					return arr.length === 2;
				},
				message: "참가자는 정확히 2명이어야 합니다",
			},
			{
				validator: function (arr) {
					return arr[0] !== arr[1];
				},
				message: "참가자는 다른 사용자여야 합니다",
			},
		],
	},
	messages: [
		{
			sender: {
				type: String,
				required: true,
			},
			content: {
				type: String,
				required: true,
			},
			timestamp: {
				type: Date,
				default: Date.now,
			},
		},
	],
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// 저장 전 미들웨어
chatSchema.pre("save", function (next) {
	// participants 정렬 및 chatId 생성
	if (this.isModified("participants")) {
		this.participants.sort();
		this.chatId = this.participants.join("-");
	}

	const currentDate = new Date();
	currentDate.setHours(currentDate.getHours() + 9); // KST is UTC +9

	this.updatedAt = currentDate;

	if (!this.createdAt) {
		this.createdAt = currentDate;
	}

	next();
});

// 업데이트 전 미들웨어
chatSchema.pre("findOneAndUpdate", function (next) {
	this.set({ updatedAt: new Date() });
	next();
});

// findOrCreate 정적 메서드 추가
chatSchema.statics.findOrCreate = async function (participants) {
	if (!Array.isArray(participants) || participants.length !== 2) {
		throw new Error(" 2명의 구성원으로 구성된 배열이어야 합니다");
	}

	const sortedParticipants = [...participants].sort();
	const chatId = sortedParticipants.join("-");

	try {
		let chat = await this.findOne({ chatId });

		if (!chat) {
			chat = await this.create({
				chatId,
				participants: sortedParticipants,
				messages: [],
			});
			console.log("채팅아이디생성:", chatId);
		}

		return chat;
	} catch (error) {
		console.error("findOrCreate 함수 오류:", error);
		throw error;
	}
};

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
