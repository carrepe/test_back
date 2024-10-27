const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// 사용자의 모든 채팅방 조회
router.get("/user/:username", async (req, res) => {
	try {
		const { username } = req.params;

		const chats = await Chat.find({
			participants: username,
		}).sort({ updatedAt: -1 }); // 최신 대화 순으로 정렬

		res.json(chats);
	} catch (error) {
		console.error("사용자 채팅을 가져오는 동안 오류 발생:", error);
		res.status(500).json({ message: "채팅을 가져오는 데 실패했습니다" });
	}
});

// 특정 채팅방 조회
router.get("/:roomId", async (req, res) => {
	try {
		const { roomId } = req.params;
		const participants = roomId.split("-");

		const chat = await Chat.findOne({
			participants: {
				$all: participants,
				$size: participants.length,
			},
		});

		if (!chat) {
			return res
				.status(404)
				.json({ message: "채팅방을 찾을 수 없습니다" });
		}

		res.json(chat);
	} catch (error) {
		console.error("채팅방 가져오기 오류:", error);
		res.status(500).json({ message: "채팅방을 가져오지 못했습니다" });
	}
});

module.exports = router;
