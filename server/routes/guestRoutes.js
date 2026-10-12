
const express = require("express");

const {
    getGuests,
    getGuestById,
    createGuest,
    updateGuest,
    deleteGuest
} = require("../controllers/guestController");

const router = express.Router();

router.get("/", getGuests);
router.get("/:id", getGuestById);
router.post("/", createGuest);
router.put("/:id", updateGuest);
router.delete("/:id", deleteGuest);

module.exports = router;
