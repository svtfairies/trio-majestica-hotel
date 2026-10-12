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
            image,
            bedType,
            capacity,
            roomSize,
            floor,
            view,
            bathroom,
            idealFor,
            highlight,
            experience,
            amenities,
            inclusions,
            totalRooms,
            pricePerNight,
            status
        } = req.body;

        if (
            !name?.trim() ||
            !description?.trim() ||
            !image?.trim() ||
            !bedType?.trim() ||
            !String(capacity ?? "").trim() ||
            !roomSize?.trim() ||
            !floor?.trim() ||
            !view?.trim() ||
            !bathroom?.trim() ||
            !idealFor?.trim() ||
            !highlight?.trim() ||
            !experience?.trim() ||
            totalRooms === undefined ||
            totalRooms === "" ||
            pricePerNight === undefined ||
            pricePerNight === ""
        ) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        if (
            !Number.isFinite(Number(totalRooms)) ||
            Number(totalRooms) < 0 ||
            !Number.isFinite(Number(pricePerNight)) ||
            Number(pricePerNight) < 0
        ) {
            return res.status(400).json({
                message: "Total rooms and price per night must be valid non-negative numbers."
            });
        }

        const existingRoom = await Room.findOne({
            name: name.trim()
        });

        if (existingRoom) {
            return res.status(409).json({
                message: "Room type already exists."
            });
        }

        const room = await Room.create({
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
            bedType: bedType.trim(),
            capacity: String(capacity).trim(),
            roomSize: roomSize.trim(),
            floor: floor.trim(),
            view: view.trim(),
            bathroom: bathroom.trim(),
            idealFor: idealFor.trim(),
            highlight: highlight.trim(),
            experience: experience.trim(),
            amenities: Array.isArray(amenities) ? amenities : [],
            inclusions: Array.isArray(inclusions) ? inclusions : [],
            totalRooms: Number(totalRooms),
            pricePerNight: Number(pricePerNight),
            status: status || "Available"
        });

        return res.status(201).json({
            message: "Room created successfully.",
            room
        });

    } catch (error) {
        console.error("Create room error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Room type already exists."
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid room information.",
                error: error.message
            });
        }

        return res.status(500).json({
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