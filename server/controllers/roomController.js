
const mongoose = require("mongoose");
const Room = require("../models/Room");
const PhysicalRoom = require("../models/PhysicalRoom");
const Booking = require("../models/Booking");

const ACTIVE_BOOKING_STATUSES = ["Pending", "Confirmed", "Checked In"];

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: 1 });
        return res.status(200).json(rooms);
    } catch (error) {
        console.error("Get rooms error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve rooms."
        });
    }
};

const getAvailablePhysicalRooms = async (req, res) => {
    try {
        const { roomTypeId, checkIn, checkOut } = req.query;

        if (!mongoose.isValidObjectId(roomTypeId)) {
            return res.status(400).json({
                success: false,
                message: "A valid room type ID is required."
            });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (
            !checkIn ||
            !checkOut ||
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            endDate <= startDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid check-in and check-out dates are required."
            });
        }

        const roomType = await Room.findById(roomTypeId);

        if (!roomType) {
            return res.status(404).json({
                success: false,
                message: "Room type not found."
            });
        }

        const physicalRooms = await PhysicalRoom.find({
            roomTypeId: roomType._id,
            status: "Available"
        }).lean();

        const activeBookings = await Booking.find({
            room: roomType._id,
            bookingStatus: {
                $in: ["Pending", "Confirmed", "Checked In"]
            },
            checkIn: { $lt: endDate },
            checkOut: { $gt: startDate }
        }).select("roomNumbers").lean();

        const bookedNumbers = new Set(
            activeBookings.flatMap((booking) => booking.roomNumbers || [])
                .map((number) => String(number))
        );

        const availableRooms = physicalRooms.filter(
            (room) => !bookedNumbers.has(String(room.roomNumber))
        );

        return res.status(200).json({
            success: true,
            roomType: roomType.name,
            totalRooms: roomType.totalRooms,
            availableCount: availableRooms.length,
            rooms: availableRooms
        });
    } catch (error) {
        console.error("Get available physical rooms error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve available room numbers."
        });
    }
};

const getAvailableRooms = async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                message: "Check-in and check-out dates are required."
            });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            endDate <= startDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid check-in and check-out dates."
            });
        }

        const rooms = await Room.find({
            status: { $nin: ["Maintenance", "Inactive"] },
            totalRooms: { $gt: 0 }
        }).sort({ pricePerNight: 1 });

        if (rooms.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                rooms: []
            });
        }

        const roomIds = rooms.map((room) => room._id);

        const occupiedRooms = await Booking.aggregate([
            {
                $match: {
                    room: { $in: roomIds },
                    bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
                    checkIn: { $lt: endDate },
                    checkOut: { $gt: startDate }
                }
            },
            {
                $group: {
                    _id: "$room",
                    bookedCount: {
                        $sum: { $ifNull: ["$roomsBooked", 1] }
                    }
                }
            }
        ]);

        const bookedRoomsMap = new Map(
            occupiedRooms.map((item) => [
                String(item._id),
                item.bookedCount
            ])
        );

        const availableRooms = rooms
            .map((room) => {
                const totalRooms = Number(room.totalRooms) || 0;
                const bookedCount = bookedRoomsMap.get(String(room._id)) || 0;
                const availableCount = Math.max(0, totalRooms - bookedCount);

                return {
                    ...room.toObject(),
                    totalRooms,
                    bookedCount,
                    availableRooms: availableCount,
                    availableCount,
                    remainingRooms: availableCount,
                    status: availableCount > 0 ? "Available" : "Fully Booked"
                };
            })
            .filter((room) => room.availableRooms > 0);

        return res.status(200).json({
            success: true,
            count: availableRooms.length,
            rooms: availableRooms
        });
    } catch (error) {
        console.error("Get available rooms error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve available rooms."
        });
    }
};

const getRoomById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID."
            });
        }

        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found."
            });
        }

        return res.status(200).json(room);
    } catch (error) {
        console.error("Get room error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve room."
        });
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

        const requiredFields = {
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
            totalRooms,
            pricePerNight
        };

        const missingField = Object.entries(requiredFields).find(
            ([, value]) =>
                value === undefined ||
                value === null ||
                (typeof value === "string" && !value.trim())
        );

        if (missingField) {
            return res.status(400).json({
                success: false,
                message: `The ${missingField[0]} field is required.`
            });
        }

        if (
            !Number.isInteger(Number(totalRooms)) ||
            Number(totalRooms) < 0 ||
            !Number.isFinite(Number(pricePerNight)) ||
            Number(pricePerNight) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid room inventory and pricing."
            });
        }

        const existingRoom = await Room.findOne({
            name: name.trim()
        });

        if (existingRoom) {
            return res.status(409).json({
                success: false,
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
            success: true,
            message: "Room created successfully.",
            room
        });
    } catch (error) {
        console.error("Create room error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Room type already exists."
            });
        }

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid room information.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create room."
        });
    }
};

const updateRoom = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID."
            });
        }

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
                success: false,
                message: "Room not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Room updated successfully.",
            room
        });
    } catch (error) {
        console.error("Update room error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update room."
        });
    }
};

const deleteRoom = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID."
            });
        }

        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found."
            });
        }

        const existingBookings = await Booking.exists({
            room: room._id,
            bookingStatus: { $in: ACTIVE_BOOKING_STATUSES }
        });

        if (existingBookings) {
            return res.status(409).json({
                success: false,
                message: "This room type has active bookings and cannot be deleted."
            });
        }

        await room.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Room deleted successfully."
        });
    } catch (error) {
        console.error("Delete room error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete room."
        });
    }
};

module.exports = {
    getRooms,
    getAvailableRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    getAvailablePhysicalRooms
};