require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const cors = require("cors");

// CORS 설정 개선
const corsOptions = {
	origin: function (origin, callback) {
		const allowedOrigins = [
			process.env.CORS_ORIGIN,
			"https://test-front-1wki.vercel.app",
			"http://localhost:5173",
		].filter(Boolean);

		// origin이 undefined인 경우도 허용
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	exposedHeaders: ["set-cookie"],
};

// 요청 로깅 미들웨어
app.use((req, res, next) => {
	console.log("Request:", {
		method: req.method,
		path: req.path,
		headers: req.headers,
		body: req.body,
		origin: req.headers.origin,
	});
	console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
	next();
});

app.use(cors(corsOptions));
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("auth", authRoutes);
app.use("posts", postRoutes);
app.use("comments", commentRoutes);
app.use("users", userRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
	console.error("Server Error:", err);
	res.status(err.status || 500).json({
		message: err.message || "서버 오류가 발생했습니다",
		error: process.env.NODE_ENV === "development" ? err : {},
	});
});

// 서버 시작 시 환경변수 확인
app.listen(port, () => {
	console.log(`서버 돌아가는 중... PORT:${port}`);
	console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
	console.log(
		"Allowed Origins:",
		[
			process.env.CORS_ORIGIN,
			"https://test-front-1wki.vercel.app",
			"http://localhost:5173",
		].filter(Boolean)
	);
});
