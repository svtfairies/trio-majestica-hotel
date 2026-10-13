const mongoose = require("mongoose");
const Notification = require("./models/Notification");
require("dotenv").config();

const sampleNotifications = [
    {
        title: "New Booking Received",
        message: "John Smith booked Room 205 for October 15–18.",
        category: "booking",
        notificationDate: new Date("2026-10-13T20:15:00+08:00")
    },
    {
        title: "Payment Received",
        message: "Payment of ₱12,500.00 received for Booking #BK-1042.",
        category: "payment",
        notificationDate: new Date("2026-10-13T19:50:00+08:00")
    },
    {
        title: "Low Stock Alert",
        message: "Bath towels are running low. Only 8 pieces remain.",
        category: "inventory",
        notificationDate: new Date("2026-10-13T19:30:00+08:00")
    },
    {
        title: "Item Out of Stock",
        message: "Shampoo bottles are out of stock. Please restock.",
        category: "inventory",
        notificationDate: new Date("2026-10-13T19:10:00+08:00")
    },
    {
        title: "Guest Checked In",
        message: "Maria Santos checked in to Room 301.",
        category: "check-in",
        notificationDate: new Date("2026-10-13T18:45:00+08:00")
    },
    {
        title: "Booking Cancellation",
        message: "Booking #BK-1035 for Room 108 has been cancelled.",
        category: "booking",
        notificationDate: new Date("2026-10-13T18:20:00+08:00")
    },
    {
        title: "Payment Pending",
        message: "Booking #BK-1045 has an outstanding balance of ₱3,500.00.",
        category: "payment",
        notificationDate: new Date("2026-10-13T17:55:00+08:00")
    },
    {
        title: "Housekeeping Completed",
        message: "Room 402 has been cleaned and is ready for guests.",
        category: "housekeeping",
        notificationDate: new Date("2026-10-13T17:30:00+08:00")
    },
    {
        title: "Maintenance Request",
        message: "An air-conditioning issue was reported in Room 206.",
        category: "maintenance",
        notificationDate: new Date("2026-10-13T17:05:00+08:00")
    },
    {
        title: "Upcoming Reservation",
        message: "Two guests are scheduled to check in to Room 210 tomorrow.",
        category: "booking",
        notificationDate: new Date("2026-10-13T16:40:00+08:00")
    },
    {
        title: "Inventory Restocked",
        message: "A delivery of 50 bath soap bars has been added to inventory.",
        category: "inventory",
        notificationDate: new Date("2026-10-13T16:15:00+08:00")
    },
    {
        title: "Guest Check-out",
        message: "Robert Garcia checked out of Room 305. Cleaning is pending.",
        category: "check-out",
        notificationDate: new Date("2026-10-13T15:50:00+08:00")
    },
    {
        title: "Refund Processed",
        message: "A refund of ₱2,000.00 was processed for Booking #BK-1029.",
        category: "payment",
        notificationDate: new Date("2026-10-13T15:25:00+08:00")
    },
    {
        title: "Low Stock: Bed Sheets",
        message: "Only 5 clean bed sheets remain in inventory.",
        category: "inventory",
        notificationDate: new Date("2026-10-13T15:00:00+08:00")
    },
    {
        title: "Room Service Order",
        message: "A new room service order was placed by the guest in Room 112.",
        category: "room-service",
        notificationDate: new Date("2026-10-13T14:35:00+08:00")
    },
    {
        title: "Booking Payment Confirmed",
        message: "Full payment of ₱8,750.00 was confirmed for Booking #BK-1025.",
        category: "payment",
        notificationDate: new Date("2026-10-13T14:10:00+08:00")
    },
    {
        title: "Housekeeping Delayed",
        message: "Room 410 cleaning is delayed before an upcoming check-in.",
        category: "housekeeping",
        notificationDate: new Date("2026-10-13T13:45:00+08:00")
    },
    {
        title: "Maintenance Completed",
        message: "The faulty shower in Room 203 has been repaired.",
        category: "maintenance",
        notificationDate: new Date("2026-10-13T13:20:00+08:00")
    },
    {
        title: "New Reservation Request",
        message: "A guest requested a three-night stay for two adults. Confirmation is pending.",
        category: "booking",
        notificationDate: new Date("2026-10-13T12:55:00+08:00")
    },
    {
        title: "Daily Revenue Summary",
        message: "Recorded room revenue has reached ₱45,800.00 today.",
        category: "report",
        notificationDate: new Date("2026-10-13T12:30:00+08:00")
    }
];

const seedNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        await Notification.deleteMany({});
        await Notification.insertMany(
            sampleNotifications.map((notification) => ({
                ...notification,
                read: false
            }))
        );

        console.log("20 sample notifications seeded successfully!");
    } catch (error) {
        console.error("Failed to seed notifications:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedNotifications();
