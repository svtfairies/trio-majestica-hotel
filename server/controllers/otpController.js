const crypto = require("crypto");
const OTP = require("../models/OTP");
const User = require("../models/User");

const { sendOTPEmail } = require("../utils/otpEmail");

const MAX_OTP_REQUESTS = 3;
const MAX_OTP_ATTEMPTS = 5;

const OTP_VALIDITY_DURATION = 10 * 60 * 1000;
const OTP_VALIDITY_MINUTES = 10;

const OTP_RESET_DURATION = 24 * 60 * 60 * 1000;

const RESEND_COOLDOWN = {
    1: 1 * 60 * 1000,
    2: 5 * 60 * 1000,
    3: 10 * 60 * 1000,
};

const RESEND_COOLDOWN_MINUTES = {
    1: 1,
    2: 5,
    3: 10,
};

const normalizeEmail = (email) => {
    return email.trim().toLowerCase();
};

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const hashOTP = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

const getOTPExpiration = () => {
    return new Date(Date.now() + OTP_VALIDITY_DURATION);
};

const getOTPResetTime = () => {
    return new Date(Date.now() + OTP_RESET_DURATION);
};

const sendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;

        if (!email || !purpose) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP purpose are required.",
            });
        }

        if (!["email-verification", "forgot-password"].includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP purpose.",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (purpose === "forgot-password" && !user) {
            return res.status(200).json({
                success: true,
                message: "If the email is registered, an OTP has been sent.",
            });
        }

        if (purpose === "email-verification" && !user) {
            return res.status(404).json({
                success: false,
                message: "No account was found with this email.",
            });
        }

        let otpRecord = await OTP.findOne({
            email: normalizedEmail,
            purpose,
        });

        const now = new Date();

        if (otpRecord && otpRecord.resetAt && now >= otpRecord.resetAt) {
            otpRecord.requestCount = 0;
            otpRecord.attempts = 0;
            otpRecord.disabled = false;
            otpRecord.resetAt = getOTPResetTime();
            otpRecord.resendAvailableAt = null;

            await otpRecord.save();
        }

        if (otpRecord && otpRecord.disabled) {
            return res.status(429).json({
                success: false,
                message: "OTP requests have been disabled after 3 requests. No more OTP requests are allowed.",
                resetAt: otpRecord.resetAt,
            });
        }

        if (otpRecord && otpRecord.resendAvailableAt && now < otpRecord.resendAvailableAt) {
            const remainingSeconds = Math.ceil(
                (otpRecord.resendAvailableAt.getTime() - now.getTime()) / 1000
            );

            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP.",
                resendCooldownSeconds: remainingSeconds,
                resendAvailableAt: otpRecord.resendAvailableAt,
            });
        }

        const requestCount = otpRecord ? otpRecord.requestCount + 1 : 1;

        if (requestCount > MAX_OTP_REQUESTS) {
            if (otpRecord) {
                otpRecord.disabled = true;
                await otpRecord.save();
            }

            return res.status(429).json({
                success: false,
                message: "You have reached the maximum of 3 OTP requests. No more OTP requests are allowed.",
                resetAt: otpRecord?.resetAt || getOTPResetTime(),
            });
        }

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        const expiresAt = getOTPExpiration();

        const resendCooldown = RESEND_COOLDOWN[requestCount];
        const resendCooldownMinutes = RESEND_COOLDOWN_MINUTES[requestCount];

        const resendAvailableAt = new Date(
            Date.now() + resendCooldown
        );

        const isLastRequest = requestCount === MAX_OTP_REQUESTS;

        if (!otpRecord) {
            otpRecord = new OTP({
                email: normalizedEmail,
                purpose,
                otpHash,
                requestCount,
                attempts: 0,
                expiresAt,
                resendAvailableAt,
                resetAt: getOTPResetTime(),
                disabled: isLastRequest,
            });
        } else {
            otpRecord.otpHash = otpHash;
            otpRecord.requestCount = requestCount;
            otpRecord.attempts = 0;
            otpRecord.expiresAt = expiresAt;
            otpRecord.resendAvailableAt = resendAvailableAt;
            otpRecord.disabled = isLastRequest;

            if (!otpRecord.resetAt) {
                otpRecord.resetAt = getOTPResetTime();
            }
        }

        await otpRecord.save();

        await sendOTPEmail(
            normalizedEmail,
            otp
        );

        return res.status(200).json({
            success: true,
            message: isLastRequest ? "Final OTP sent. No more OTP requests are allowed." : "OTP sent successfully.",
            requestCount,
            remainingRequests: MAX_OTP_REQUESTS - requestCount,
            resendCooldownSeconds: resendCooldown / 1000,
            resendCooldownMinutes,
            otpValiditySeconds: OTP_VALIDITY_DURATION / 1000,
            otpValidityMinutes: OTP_VALIDITY_MINUTES,
            isLastRequest,
            resetAt: otpRecord.resetAt,
        });
    } catch (error) {
        console.error("Send OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP.",
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp, purpose } = req.body;

        if (!email || !otp || !purpose) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, and purpose are required.",
            });
        }

        if (!["email-verification", "forgot-password"].includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP purpose.",
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "OTP must contain exactly 6 digits.",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        const otpRecord = await OTP.findOne({
            email: normalizedEmail,
            purpose,
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found or has already expired.",
            });
        }

        const now = new Date();

        if (otpRecord.resetAt && now >= otpRecord.resetAt) {
            otpRecord.requestCount = 0;
            otpRecord.attempts = 0;
            otpRecord.disabled = false;
            otpRecord.resetAt = getOTPResetTime();

            await otpRecord.save();
        }

        if (now > otpRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "This OTP has expired.",
            });
        }

        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect OTP attempts.",
            });
        }

        const submittedHash = hashOTP(otp);

        const storedBuffer = Buffer.from(otpRecord.otpHash, "hex");
        const submittedBuffer = Buffer.from(submittedHash, "hex");

        const isValid = crypto.timingSafeEqual(
            storedBuffer,
            submittedBuffer
        );

        if (!isValid) {
            otpRecord.attempts += 1;

            await otpRecord.save();

            const remainingAttempts =
                MAX_OTP_ATTEMPTS - otpRecord.attempts;

            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
                remainingAttempts,
            });
        }

        await OTP.deleteOne({
            _id: otpRecord._id,
        });

        if (purpose === "forgot-password") {
            const resetToken = crypto.randomBytes(32).toString("hex");

            const resetTokenHash = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            const resetTokenExpires = new Date(
                Date.now() + 10 * 60 * 1000
            );

            const user = await User.findOne({
                email: normalizedEmail,
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User account not found.",
                });
            }

            user.passwordResetToken = resetTokenHash;
            user.passwordResetExpires = resetTokenExpires;

            await user.save();

            return res.status(200).json({
                success: true,
                message: "OTP verified successfully.",
                resetToken,
                resetTokenExpiresIn: 10 * 60,
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
        });
    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP.",
        });
    }
};

const resendOTP = async (req, res) => {
    return sendOTP(req, res);
};

module.exports = {
    sendOTP,
    verifyOTP,
    resendOTP,
};