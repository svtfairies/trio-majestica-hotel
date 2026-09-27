const express = require("express");

const {
    register,
    login,
    getMe,
    checkAdminExists,
    resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/reset-password", resetPassword);

router.get("/me", protect, getMe);

router.get("/admin-exists", checkAdminExists);

module.exports = router;