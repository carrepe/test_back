require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const cors = require("cors");
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
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
