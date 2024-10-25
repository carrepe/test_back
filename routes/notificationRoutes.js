const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/:username", notificationController.getNotifications);
router.delete("/:notificationId", notificationController.markAsRead);

module.exports = router;
