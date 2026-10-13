const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

router.get("/", async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ notificationDate: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
});

router.patch("/:id/read", async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: req.body.read },
            { new: true, runValidators: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(400).json({
            message: "Failed to update notification",
            error: error.message
        });
    }
});

router.patch("/read-all", async (req, res) => {
    try {
        await Notification.updateMany(
            { read: false },
            { $set: { read: true } }
        );

        res.status(200).json({
            message: "All notifications marked as read"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update notifications",
            error: error.message
        });
    }
});

module.exports = router;
