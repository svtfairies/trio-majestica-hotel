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
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        }
    );
};

const sanitizeUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    };
};

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const requestedRole = role === "admin" ? "admin" : "guest";

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        if (requestedRole === "admin") {
            const existingAdmin = await User.findOne({
                role: "admin",
            });

            if (existingAdmin) {
                return res.status(409).json({
                    success: false,
                    message: "Admin registration is no longer available. Only one Admin account is allowed.",
                });
            }
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: requestedRole,
            status: "active",
        });

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create account.",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "This account is inactive.",
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login.",
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user information.",
        });
    }
};

const checkAdminExists = async (req, res) => {
    try {
        const adminExists = await User.exists({
            role: "admin",
        });

        return res.status(200).json({
            success: true,
            hasAdmin: !!adminExists,
        });
    } catch (error) {
        console.error("Check Admin error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to check Admin account.",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, password, resetToken } = req.body;

        if (!email || !password || !resetToken) {
            return res.status(400).json({
                success: false,
                message: "Email, password, and reset token are required.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            email: normalizedEmail,
            passwordResetToken: resetTokenHash,
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token.",
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
                message: "Your password reset session has expired. Please request a new OTP.",
            });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Your password has been reset successfully.",
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset your password.",
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    checkAdminExists,
    resetPassword,
};