require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");

// 허용된 오리진 목록 정의
const allowedOrigins = [
	process.env.CORS_ORIGIN,
	"https://test-front-1wki.vercel.app",
	"https://test-front-1wki-hpsbx8d3o-somypages-projects-9a741add.vercel.app",
	"http://localhost:5173",
].filter(Boolean);

// CORS 설정
const corsConfig = {
	origin: (origin, callback) => {
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

// Socket.IO CORS 설정 적용
io.engine.corsOptions = corsConfig;

// Socket.IO 설정
require("./socket/chat")(io);

// 미들웨어 설정
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

app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// MongoDB 연결 및 설정
const connectMongoDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB 연결 성공");

		mongoose.connection.on("error", (err) => {
			console.error("MongoDB 연결 에러:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("MongoDB 연결 끊김. 재연결 시도...");
		});

		if (process.env.NODE_ENV === "development") {
			mongoose.set("debug", true);
		}
	} catch (err) {
		console.error("MongoDB 연결 실패:", err);
		process.exit(1);
	}
};

connectMongoDB();

// 라우터 설정
const routes = {
	auth: require("./routes/authRoutes"),
	posts: require("./routes/postRoutes"),
	comments: require("./routes/commentRoutes"),
	users: require("./routes/userRoutes"),
	notifications: require("./routes/notificationRoutes"),
	chats: require("./routes/chatRoutes"),
};

Object.entries(routes).forEach(([path, router]) => {
	app.use(`/${path}`, router);
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
	console.error("Server Error:", err);
	res.status(err.status || 500).json({
		message: err.message || "서버 오류가 발생했습니다",
		error: process.env.NODE_ENV === "development" ? err : {},
	});
});

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

// 서버 시작
const startServer = async () => {
	try {
		let currentPort = port;
		while (!(await checkPort(currentPort))) {
			currentPort++;
			if (currentPort > 65535) {
				throw new Error("사용 가능한 포트를 찾을 수 없습니다.");
			}
		}

		httpServer.listen(currentPort, () => {
			console.log(`서버 돌아가는 중... PORT:${currentPort}`);
			console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
			console.log("Allowed Origins:", allowedOrigins);
		});
	} catch (error) {
		console.error("서버 시작 실패:", error);
		process.exit(1);
	}
};

startServer();
