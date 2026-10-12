
const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const { getBookings, getBookingById, createBooking, updateBooking, deleteBooking, getBookingSummary } = require("../controllers/bookingController");

router.use(protect);
router.use(authorize("receptionist", "admin"));

router.get("/summary", getBookingSummary);
router.get("/", getBookings);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

module.exports = router;