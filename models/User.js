const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		userImage: { type: String, default: "" },

		createdAt: Date,
		updatedAt: Date,
	}
	// {
	// 	timestamps: true,
	// }
	// { versionKey: false }
);
UserSchema.pre("save", function (next) {
	const currentDate = new Date();
	currentDate.setHours(currentDate.getHours() + 9); // KST is UTC +9

	this.updatedAt = currentDate;

	if (!this.createdAt) this.createdAt = currentDate;

	next();
});

const UserModal = model("User", UserSchema);
module.exports = UserModal;
