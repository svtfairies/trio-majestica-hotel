const Room = require("../models/Room");

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: 1 });
        res.status(200).json(rooms);
    } catch (error) {
        console.error("Get rooms error:", error);
        res.status(500).json({ message: "Failed to retrieve rooms." });
    }
};

const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        res.status(200).json(room);
    } catch (error) {
        console.error("Get room error:", error);
        res.status(500).json({ message: "Failed to retrieve room." });
    }
};

const createRoom = async (req, res) => {
    try {
        const {
            name,
            description,
            bedType,
            capacity,
            totalRooms,
            status
        } = req.body;

        if (
            !name ||
            !description ||
            !bedType ||
            !capacity ||
            totalRooms === undefined
        ) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        const existingRoom = await Room.findOne({ name });

        if (existingRoom) {
            return res.status(409).json({
                message: "Room type already exists."
            });
        }

        const room = await Room.create({
            name,
            description,
            bedType,
            capacity,
            totalRooms,
            status
        });

        res.status(201).json({
            message: "Room created successfully.",
            room
        });
    } catch (error) {
        console.error("Create room error:", error);
        res.status(500).json({
            message: "Failed to create room."
        });
    }
};

const updateRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!room) {
            return res.status(404).json({
                message: "Room not found."
            });
        }

        res.status(200).json({
            message: "Room updated successfully.",
            room
        });
    } catch (error) {
        console.error("Update room error:", error);
        res.status(500).json({
            message: "Failed to update room."
        });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found."
            });
        }

        res.status(200).json({
            message: "Room deleted successfully."
        });
    } catch (error) {
        console.error("Delete room error:", error);
        res.status(500).json({
            message: "Failed to delete room."
        });
    }
};

module.exports = {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
};