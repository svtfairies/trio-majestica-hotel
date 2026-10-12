
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const tls = require("tls");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const guestRoutes = require("./routes/guestRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/guests", guestRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Trio Majestica Hotel API is running.",
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found.",
    });
});

app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.status ? err.message : "Internal server error.",
    });
});

const PORT = process.env.PORT || 5000;

const secureContext = tls.createSecureContext({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
});

async function connectDB() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from the .env file.");
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,
            tls: true,
            secureContext,
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}

connectDB();