const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
	try {
		const { username } = req.params;
		const notifications = await Notification.find({
			recipient: username,
			isRead: false,
		}).sort({ createdAt: -1 });
		res.json(notifications);
	} catch (error) {
		res.status(500).json({ message: "알림을 가져오는데 실패했습니다." });
	}
};

exports.markAsRead = async (req, res) => {
	try {
		const { notificationId } = req.params;
		await Notification.findByIdAndDelete(notificationId);
		res.json({ message: "알림이 삭제되었습니다." });
	} catch (error) {
		res.status(500).json({ message: "알림 삭제에 실패했습니다." });
	}
};
