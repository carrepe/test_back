require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const cors = require("cors");
// 환경변수가 제대로 적용되었는지 확인을 위해 수정
app.use((req, res, next) => {
	console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN); // 로그 추가
	next();
});

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "https://test-front-1wki.vercel.app",
		credentials: true,
	})
);

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

app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/users", userRoutes);

app.listen(port, () => {
	console.log(`서버 돌아가는 중...`);
});
