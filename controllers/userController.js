const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.getUserInfo = async (req, res) => {
	const { username } = req.params;
	try {
		const userDoc = await User.findOne({ username });
		if (!userDoc) {
			return res
				.status(404)
				.json({ message: "사용자정보를 찾을 수 없어요" });
		}
		res.json(userDoc);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "서버에러" });
	}
};

exports.updateUserInfo = async (req, res) => {
	const { username } = req.params;
	const { password, newpassword, isKakaoUser } = req.body;

	try {
		const userDoc = await User.findOne({ username });
		if (!userDoc) {
			return res
				.status(404)
				.json({ message: "사용자정보를 찾을 수 없어요" });
		}

		const updateData = {};

		// 카카오 사용자가 아닌 경우에만 비밀번호 검증
		if (isKakaoUser !== "true") {
			const passOk = bcrypt.compareSync(password, userDoc.password);
			if (!passOk) {
				return res
					.status(400)
					.json({ message: "현재 비밀번호가 맞지 않아요" });
			}
		}

		// 새 비밀번호가 있는 경우 업데이트
		if (newpassword) {
			updateData.password = bcrypt.hashSync(newpassword, 10);
		}

		// 새 이미지가 있는 경우 업데이트
		if (req.file) {
			updateData.userImage = req.file.filename;
		}

		// 업데이트할 내용이 있는 경우에만 업데이트 수행
		if (Object.keys(updateData).length > 0) {
			await User.findByIdAndUpdate(userDoc._id, updateData);
		}

		res.json({ message: "사용자 정보가 정상적으로 수정되었습니다" });
	} catch (error) {
		console.error("사용자정보 수정 에러:", error);
		res.status(500).json({ message: "서버에러" });
	}
};
