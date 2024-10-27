require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
	cors: {
		origin: function (origin, callback) {
			const allowedOrigins = [
				process.env.CORS_ORIGIN,
				"https://test-front-1wki.vercel.app",
				"https://test-front-1wki-hpsbx8d3o-somypages-projects-9a741add.vercel.app",
				"http://localhost:5173",
			].filter(Boolean);

			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposedHeaders: ["set-cookie"],
	},
});

require("./socket/chat")(io);

const cors = require("cors");

// CORS 설정 개선
const corsOptions = {
	origin: function (origin, callback) {
		const allowedOrigins = [
			process.env.CORS_ORIGIN,
			"https://test-front-1wki.vercel.app",
			"https://test-front-1wki-hpsbx8d3o-somypages-projects-9a741add.vercel.app",
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
	allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
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

// MongoDB 연결
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log("MongoDB 연결 성공");
	})
	.catch((err) => {
		console.error("MongoDB 연결 실패:", err);
	});

// MongoDB 연결 에러 모니터링
mongoose.connection.on("error", (err) => {
	console.error("MongoDB 연결 에러:", err);
});

mongoose.connection.on("disconnected", () => {
	console.log("MongoDB 연결 끊김. 재연결 시도...");
});

// MongoDB 디버그 모드 활성화 (개발 환경에서만)
if (process.env.NODE_ENV === "development") {
	mongoose.set("debug", true);
}

// ----------------------------------------------------------

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

// 라우터
// app.use("/auth", authRoutes);
// '/'로 시작하면 https://test-back-1wki.vercel.app//auth 이런식으로 되어버림
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/users", userRoutes);
// 알림기능 라우터
app.use("/notifications", notificationRoutes);
app.use("/chats", chatRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
	console.error("Server Error:", err);
	res.status(err.status || 500).json({
		message: err.message || "서버 오류가 발생했습니다",
		error: process.env.NODE_ENV === "development" ? err : {},
	});
});

// 서버 시작 시 환경변수 확인
// app.listen(port, () => {
// 	console.log(`서버 돌아가는 중... PORT:${port}`);
// 	console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
// 	console.log(
// 		"Allowed Origins:",
// 		[
// 			process.env.CORS_ORIGIN,
// 			"https://test-front-1wki.vercel.app",
// 			"http://localhost:5173",
// 		].filter(Boolean)
// 	);
// });

// 포트 체크 함수
const checkPort = (port) => {
	return new Promise((resolve, reject) => {
		const server = require("net")
			.createServer()
			.once("error", (err) => {
				if (err.code === "EADDRINUSE") {
					resolve(false);
				} else {
					reject(err);
				}
			})
			.once("listening", () => {
				server.close();
				resolve(true);
			})
			.listen(port);
	});
};

// 사용 가능한 포트 찾기
const startServer = async () => {
	try {
		let currentPort = port;
		while (!(await checkPort(currentPort))) {
			currentPort++;
			if (currentPort > 65535) {
				// 최대 포트 번호 체크
				throw new Error("사용 가능한 포트를 찾을 수 없습니다.");
			}
		}

		httpServer.listen(currentPort, () => {
			console.log(`서버 돌아가는 중... PORT:${currentPort}`);
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
	} catch (error) {
		console.error("서버 시작 실패:", error);
		process.exit(1);
	}
};

startServer();
