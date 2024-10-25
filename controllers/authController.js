const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
	const { username, password } = req.body;
	try {
		const userDoc = await User.create({
			username,
			password: bcrypt.hashSync(password, 10),
		});
		res.json(userDoc);
	} catch (err) {
		res.status(409).json({
			message: "이미 존재하는 이름입니다",
			filed: "username",
		});
	}
};

// 공통 쿠키 옵션
const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",

	// sameSite 쿠키의 보안 정책을 설정하는 속성
	// 프론트엔드와 백엔드가 다른 도메인인 경우 (배포 환경)
	sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	path: "/",
};

exports.login = async (req, res) => {
	const { username, password } = req.body;
	const userDoc = await User.findOne({ username });
	if (!userDoc) {
		return res.status(401).json({ message: "존재하지 않는 사용자입니다" });
	}
	const passOk = bcrypt.compareSync(password, userDoc.password);
	if (passOk) {
		jwt.sign(
			{ username, id: userDoc._id },
			process.env.SECRET_KEY,
			{},
			(err, token) => {
				if (err) throw err;
				res.cookie("token", token, {
					...cookieOptions,
					maxAge: 24 * 60 * 60 * 1000, // 24시간
				}).json({
					id: userDoc._id,
					username,
				});
			}
		);
	} else {
		res.status(401).json({ message: "비밀번호가 틀렸습니다" });
	}
};

exports.logout = (req, res) => {
	res.clearCookie("token", cookieOptions).json({
		message: "로그아웃 되었습니다",
	});
};

exports.getProfile = async (req, res) => {
	const { token } = req.cookies;
	if (!token) return res.json("토큰없음");
	try {
		jwt.verify(token, process.env.SECRET_KEY, {}, (err, info) => {
			if (err) throw err;
			res.json(info);
		});
	} catch (err) {
		return res.status(401).json("인증필요");
	}
};
