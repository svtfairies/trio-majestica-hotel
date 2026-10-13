const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: [
                "booking",
                "payment",
                "inventory",
                "check-in",
                "check-out",
                "housekeeping",
                "maintenance",
                "room-service",
                "report"
            ],
            required: true
        },
        read: {
            type: Boolean,
            default: false
        },
        notificationDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);