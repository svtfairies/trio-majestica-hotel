
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Room = require("../models/Room");

const ACTIVE_STATUSES = ["Pending", "Confirmed", "Checked In"];

const getErrorMessage = (error) => {
    if (error.name === "ValidationError") {
        return Object.values(error.errors)
            .map((item) => item.message)
            .join(" ");
    }

    if (error.code === 11000) {
        return "A duplicate booking reference was detected. Please try again.";
    }

    return "An unexpected server error occurred.";
};

const validateRoomAvailability = async ({
    roomId,
    checkIn,
    checkOut,
    adults,
    children,
    excludeBookingId
}) => {
    if (!mongoose.isValidObjectId(roomId)) {
        return { error: "Please select a valid room." };
    }

    const room = await Room.findById(roomId);

    if (!room) {
        return { error: "The selected room was not found." };
    }

    if (["Maintenance", "Inactive"].includes(room.status)) {
        return { error: "This room is not available for booking." };
    }

    const totalGuests = Number(adults) + Number(children);

    const capacityMatch = String(room.capacity).match(/\d+/);
    const roomCapacity = capacityMatch ? Number(capacityMatch[0]) : null;

    if (roomCapacity !== null && totalGuests > roomCapacity) {
        return {
            error: `This room can accommodate up to ${roomCapacity} guests.`
        };
    }

    const overlappingBookings = await Booking.countDocuments({
        room: roomId,
        bookingStatus: { $in: ACTIVE_STATUSES },
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) },
        ...(excludeBookingId ? { _id: { $ne: excludeBookingId }} : {})
    });

    if (overlappingBookings >= room.totalRooms) {
        return {
            error: "No rooms of this type are available for these dates."
        };
    }

    return { room };
};

exports.getBookings = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            status,
            room,
            search
        } = req.query;

        const filter = {};

        if (startDate || endDate) {
            filter.checkIn = {};

            if (startDate) {
                filter.checkIn.$gte = new Date(startDate);
            }

            if (endDate) {
                filter.checkIn.$lte = new Date(endDate);
            }
        }

        if (status && status !== "All") {
            filter.bookingStatus = status;
        }

        if (room && mongoose.isValidObjectId(room)) {
            filter.room = room;
        }

        if (search && search.trim()) {
            const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { guestName: { $regex: safeSearch, $options: "i" } },
                { guestEmail: { $regex: safeSearch, $options: "i" } },
                { bookingReference: { $regex: safeSearch, $options: "i" } }
            ];
        }

        const bookings = await Booking.find(filter)
            .populate("room", "name pricePerNight totalRooms status capacity")
            .sort({ checkIn: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: getErrorMessage(error)
        });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("room", "name pricePerNight totalRooms status capacity");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: getErrorMessage(error)
        });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const {
            guestName,
            guestEmail,
            guestPhone,
            room: roomId,
            checkIn,
            checkOut,
            adults = 1,
            children = 0,
            paymentStatus = "Unpaid",
            bookingStatus = "Pending",
            specialRequests = ""
        } = req.body;

        if (!guestName || !guestEmail || !guestPhone || !roomId || !checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required booking fields."
            });
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return res.status(400).json({
                success: false,
                message: "Check-out must be after check-in."
            });
        }

        if (!Number.isInteger(Number(adults)) || Number(adults) < 1 || !Number.isInteger(Number(children)) || Number(children) < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid guest counts."
            });
        }

        if (!["Pending", "Confirmed"].includes(bookingStatus)) {
            return res.status(400).json({
                success: false,
                message: "New bookings can only be Pending or Confirmed."
            });
        }

        if (!["Unpaid", "Partially Paid", "Paid"].includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status."
            });
        }

        const availability = await validateRoomAvailability({
            roomId,
            checkIn: start,
            checkOut: end,
            adults: Number(adults),
            children: Number(children)
        });

        if (availability.error) {
            return res.status(409).json({
                success: false,
                message: availability.error
            });
        }

        const totalNights = Math.ceil(
            (end - start) / (1000 * 60 * 60 * 24)
        );

        const booking = await Booking.create({
            guestName,
            guestEmail,
            guestPhone,
            room: roomId,
            checkIn: start,
            checkOut: end,
            adults: Number(adults),
            children: Number(children),
            totalNights,
            totalAmount: totalNights * availability.room.pricePerNight,
            paymentStatus,
            bookingStatus,
            specialRequests,
            createdBy: req.user?._id || req.user?.id || null
        });

        const populatedBooking = await Booking.findById(booking._id).populate("room", "name pricePerNight totalRooms status capacity");

        res.status(201).json({
            success: true,
            message: "Booking created successfully.",
            booking: populatedBooking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: getErrorMessage(error)
        });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const allowedFields = [
            "guestName",
            "guestEmail",
            "guestPhone",
            "room",
            "checkIn",
            "checkOut",
            "adults",
            "children",
            "paymentStatus",
            "bookingStatus",
            "specialRequests"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const nextRoom = updates.room || booking.room.toString();
        const nextCheckIn = updates.checkIn || booking.checkIn;
        const nextCheckOut = updates.checkOut || booking.checkOut;
        const nextAdults = updates.adults ?? booking.adults;
        const nextChildren = updates.children ?? booking.children;
        const nextStatus = updates.bookingStatus || booking.bookingStatus;

        if (!mongoose.isValidObjectId(nextRoom) || Number.isNaN(new Date(nextCheckIn).getTime()) || Number.isNaN(new Date(nextCheckOut).getTime()) || new Date(nextCheckOut) <= new Date(nextCheckIn)) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid room and booking dates."
            });
        }

        if (!Number.isInteger(Number(nextAdults)) || Number(nextAdults) < 1 || !Number.isInteger(Number(nextChildren)) || Number(nextChildren) < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid guest counts."
            });
        }

        if (!["Pending", "Confirmed", "Checked In", "Checked Out", "Cancelled", "No Show"].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking status."
            });
        }

        if (updates.paymentStatus && !["Unpaid", "Partially Paid", "Paid", "Refunded"].includes(updates.paymentStatus)) {
            return res.status(400).json({success: false, message: "Invalid payment status."});
        }

        if (ACTIVE_STATUSES.includes(nextStatus)) {
            const availability = await validateRoomAvailability({
                roomId: nextRoom,
                checkIn: nextCheckIn,
                checkOut: nextCheckOut,
                adults: Number(nextAdults),
                children: Number(nextChildren),
                excludeBookingId: booking._id
            });

            if (availability.error) {
                return res.status(409).json({success: false, message: availability.error});
            }

            const nights = Math.ceil((new Date(nextCheckOut) - new Date(nextCheckIn)) / (1000 * 60 * 60 * 24));

            updates.totalNights = nights;
            updates.totalAmount = nights * availability.room.pricePerNight;
        }

        Object.assign(booking, updates);
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id).populate("room", "name pricePerNight totalRooms status capacity");

        res.status(200).json({
            success: true,
            message: "Booking updated successfully.",
            booking: updatedBooking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: getErrorMessage(error)
        });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: "Booking deleted successfully."
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: getErrorMessage(error)
        });
    }
};

exports.getBookingSummary = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [total, todayArrivals, todayDepartures, pending, checkedIn] =
            await Promise.all([
                Booking.countDocuments({
                    bookingStatus: { $nin: ["Cancelled", "No Show"] }
                }),
                Booking.countDocuments({
                    checkIn: { $gte: today, $lt: tomorrow },
                    bookingStatus: { $in: ["Pending", "Confirmed"] }
                }),
                Booking.countDocuments({
                    checkOut: { $gte: today, $lt: tomorrow },
                    bookingStatus: "Checked In"
                }),
                Booking.countDocuments({ bookingStatus: "Pending" }),
                Booking.countDocuments({ bookingStatus: "Checked In" })
            ]);

        res.status(200).json({
            success: true,
            summary: {
                total,
                todayArrivals,
                todayDepartures,
                pending,
                checkedIn
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: getErrorMessage(error)
        });
    }
};