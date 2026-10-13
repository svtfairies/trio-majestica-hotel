const express = require("express");
const { register, login, getMe, updateProfile, deleteMe, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);
router.delete("/me", protect, deleteMe);

module.exports = router;