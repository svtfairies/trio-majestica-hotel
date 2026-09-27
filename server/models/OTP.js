const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ["email-verification", "forgot-password"],
            required: true,
        },
        requestCount: {
            type: Number,
            default: 1,
            min: 0,
            max: 3,
        },
        attempts: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        resendAvailableAt: {
            type: Date,
            default: null,
        },
        resetAt: {
            type: Date,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

otpSchema.index({
    email: 1,
    purpose: 1,
});

module.exports = mongoose.model("OTP", otpSchema);