const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const tls = require("tls");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Trio Majestica Hotel API is running.",
    });
});

const PORT = process.env.PORT || 5000;

const secureContext = tls.createSecureContext({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
});

async function connectDB() {
    try {
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
        console.error("MongoDB connection error:");
        console.error(error);
        process.exit(1);
    }
}

connectDB();