const express = require("express");

const { sendOTP, verifyOTP, resendOTP, } = require("../controllers/otpController");

const router = express.Router();

router.post("/send", sendOTP);

router.post("/verify", verifyOTP);

router.post("/resend", resendOTP);

module.exports = router;