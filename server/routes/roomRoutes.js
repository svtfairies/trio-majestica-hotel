const express = require("express");
const { getRooms, getAvailableRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require("../controllers/roomController");
const router = express.Router();

router.get("/available", getAvailableRooms);
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.post("/", createRoom);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

module.exports = router;