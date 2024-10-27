const Chat = require("../models/Chat");

module.exports = (io) => {
	const findOrCreateChat = async (participants) => {
		try {
			// Chat 모델의 findOrCreate 정적 메서드 사용
			const chat = await Chat.findOrCreate(participants);
			return chat;
		} catch (error) {
			console.error("Error in findOrCreateChat:", error);
			throw error;
		}
	};

	io.on("connection", (socket) => {
		console.log("사용자 연결:", socket.id);

		socket.on("join", ({ username }) => {
			if (username) {
				socket.join(username);
				socket.username = username;
				console.log(`${username} 개인 방에 가입했습니다`);
			}
		});

		socket.on("leave", ({ username }) => {
			if (username) {
				socket.leave(username);
				delete socket.username;
				console.log(`${username} 개인 방을 떠났습니다`);
			}
		});

		socket.on("chat_request", async ({ sender, receiver }) => {
			try {
				console.log("채팅 요청:", { sender, receiver });

				// 채팅방 찾기 또는 생성
				const chat = await findOrCreateChat([sender, receiver]);
				const roomId = chat._id.toString();

				// 수신자에게 채팅 요청 전송
				io.to(receiver).emit("chat_request", {
					sender,
					roomId,
					timestamp: new Date(),
				});

				// 송신자를 채팅방에 참여시킴
				socket.join(roomId);

				// 양쪽 모두에게 채팅 목록 업데이트 알림
				[sender, receiver].forEach((participant) => {
					io.to(participant).emit("update_chat_list");
				});

				// 성공 응답
				socket.emit("chat_request_success", {
					roomId,
					receiver,
					chat,
				});
			} catch (error) {
				console.error("채팅요청 오류:", error);
				socket.emit("error", {
					message: "채팅 요청을 처리하지 못했습니다",
					error: error.message,
				});
			}
		});

		socket.on("join_chat", async ({ participants }) => {
			try {
				const chat = await findOrCreateChat(participants);
				const chatRoomId = chat._id.toString();

				// 채팅방 참여
				socket.join(chatRoomId);
				console.log(`채팅방 가입: ${chatRoomId}`);

				// 이전 메시지 전송
				socket.emit("previous_messages", chat.messages);

				// 채팅 목록 업데이트 알림
				participants.forEach((participant) => {
					io.to(participant).emit("update_chat_list");
				});
			} catch (error) {
				console.error("참여 오류:", error);
				socket.emit("error", {
					message: "채팅방 가입 실패",
					error: error.message,
				});
			}
		});

		socket.on(
			"send_message",
			async ({ participants, sender, content, timestamp }) => {
				try {
					const chat = await findOrCreateChat(participants);
					const chatRoomId = chat._id.toString();

					const message = {
						sender,
						content,
						timestamp: timestamp || new Date(),
					};

					// 메시지 저장
					chat.messages.push(message);
					chat.updatedAt = new Date();
					await chat.save();

					console.log("채팅방에 저장된 메시지:", chatRoomId);

					// 채팅방의 모든 참여자에게 메시지 전송
					io.to(chatRoomId).emit("receive_message", message);

					// 채팅 목록 업데이트 알림
					participants.forEach((participant) => {
						io.to(participant).emit("update_chat_list");
					});
				} catch (error) {
					console.error("메시지 전송 오류:", error);
					socket.emit("error", {
						message: "메시지 전송 실패",
						error: error.message,
					});
				}
			}
		);

		socket.on("chat_accepted", async ({ sender, receiver, roomId }) => {
			try {
				console.log("Chat accepted:", { sender, receiver, roomId });

				const chat = await Chat.findById(roomId);
				if (!chat) {
					throw new Error("채팅방을 찾을 수 없습니다");
				}

				// 채팅방 참여
				socket.join(roomId);

				// 발신자에게 채팅 수락 알림
				io.to(sender).emit("chat_accepted", {
					sender,
					receiver,
					roomId,
				});

				// 채팅 목록 업데이트 알림
				chat.participants.forEach((participant) => {
					io.to(participant).emit("update_chat_list");
				});
			} catch (error) {
				console.error("채팅 승인 오류:", error);
				socket.emit("error", {
					message: "채팅 수락 실패",
					error: error.message,
				});
			}
		});

		socket.on("leave_chat", async ({ participants }) => {
			try {
				const chat = await findOrCreateChat(participants);
				if (chat) {
					const chatRoomId = chat._id.toString();
					socket.leave(chatRoomId);
					console.log(`Left chat room: ${chatRoomId}`);
				}
			} catch (error) {
				console.error("채팅 종료 오류:", error);
				socket.emit("error", {
					message: "채팅방에서 나가지 못함",
					error: error.message,
				});
			}
		});

		socket.on("delete_chat", async ({ participants, roomId }) => {
			try {
				const result = await Chat.findByIdAndDelete(roomId);
				if (result) {
					// 채팅방의 모든 참여자에게 삭제 알림
					io.to(roomId).emit("chat_deleted");

					// 모든 소켓을 채팅방에서 제거
					const sockets = await io.in(roomId).fetchSockets();
					for (const s of sockets) {
						s.leave(roomId);
					}

					// 채팅 목록 업데이트 알림
					participants.forEach((participant) => {
						io.to(participant).emit("update_chat_list");
					});

					console.log(`채팅 삭제: ${roomId}`);
				} else {
					console.log("삭제할 채팅을 찾을 수 없습니다");
					socket.emit("error", {
						message: "채팅을 찾을 수 없습니다",
					});
				}
			} catch (error) {
				console.error("채팅 삭제 오류:", error);
				socket.emit("error", {
					message: "채팅 삭제 오류",
					error: error.message,
				});
			}
		});

		socket.on("disconnect", () => {
			if (socket.username) {
				console.log(
					`사용자 ${socket.username} 연결 해제됨:`,
					socket.id
				);
				socket.leave(socket.username);
			} else {
				console.log("알 수 없는 사용자 연결이 끊겼습니다:", socket.id);
			}
		});
	});
};
