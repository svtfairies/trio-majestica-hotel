
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const PASSWORD_RESET_TOKEN_DURATION = 10 * 60 * 1000;

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
};

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
});

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid registration data."
            });
        }

        const normalizedName = name.trim().replace(/\s+/g, " ");
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            role: "receptionist",
            status: "active"
        });

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: "Receptionist account created successfully.",
            token,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error("Register error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: Object.values(error.errors).map((item) => item.message).join(" ")
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create account. Please check the server configuration."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid login data."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (user.role !== "receptionist") {
            return res.status(403).json({
                success: false,
                message: "Only receptionist accounts can access this system."
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "This account is inactive."
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.role !== "receptionist") {
            return res.status(403).json({
                success: false,
                message: "Only receptionist accounts can access this system."
            });
        }

        return res.status(200).json({
            success: true,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user information."
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, password, resetToken } = req.body;

        if (!email || !password || !resetToken) {
            return res.status(400).json({
                success: false,
                message: "Email, password, and reset token are required."
            });
        }

        if (typeof email !== "string" || typeof password !== "string" || typeof resetToken !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid password reset data."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            email: normalizedEmail,
            passwordResetToken: resetTokenHash
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token."
            });
        }

        if (
            !user.passwordResetExpires ||
            new Date() > user.passwordResetExpires
        ) {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;

            await user.save();

            return res.status(400).json({
                success: false,
                message: "Your password reset session has expired. Please request a new OTP."
            });
        }

        if (user.role !== "receptionist") {
            return res.status(403).json({
                success: false,
                message: "Only receptionist accounts can reset passwords."
            });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Your password has been reset successfully."
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset your password."
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    resetPassword
};