
const Guest = require("../models/Guest");

const getGuests = async (req, res) => {
    try {
        const guests = await Guest.find().sort({ addedDate: -1 });

        res.status(200).json(guests);
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve guests",
            error: error.message
        });
    }
};

const getGuestById = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id);

        if (!guest) {
            return res.status(404).json({
                message: "Guest not found"
            });
        }

        res.status(200).json(guest);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid guest ID"
            });
        }

        res.status(500).json({
            message: "Failed to retrieve guest",
            error: error.message
        });
    }
};

const createGuest = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            nationality,
            idType,
            idNumber,
            notes
        } = req.body;

        if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
            return res.status(400).json({
                message: "First name, last name, and phone number are required"
            });
        }

        if (dateOfBirth && Number.isNaN(Date.parse(dateOfBirth))) {
            return res.status(400).json({
                message: "Invalid date of birth"
            });
        }

        if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
            return res.status(400).json({
                message: "Date of birth cannot be in the future"
            });
        }

        const guest = await Guest.create({
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth: dateOfBirth || null,
            nationality,
            idType,
            idNumber,
            notes
        });

        res.status(201).json({
            message: "Guest created successfully",
            guest
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to create guest",
            error: error.message
        });
    }
};

const updateGuest = async (req, res) => {
    try {
        const allowedFields = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "dateOfBirth",
            "nationality",
            "idType",
            "idNumber",
            "notes"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        });

        if (
            ("firstName" in updates && !updates.firstName?.trim()) ||
            ("lastName" in updates && !updates.lastName?.trim()) ||
            ("phone" in updates && !updates.phone?.trim())
        ) {
            return res.status(400).json({
                message: "First name, last name, and phone number cannot be empty"
            });
        }

        if (
            updates.dateOfBirth &&
            Number.isNaN(Date.parse(updates.dateOfBirth))
        ) {
            return res.status(400).json({
                message: "Invalid date of birth"
            });
        }

        if (
            updates.dateOfBirth &&
            new Date(updates.dateOfBirth) > new Date()
        ) {
            return res.status(400).json({
                message: "Date of birth cannot be in the future"
            });
        }

        const guest = await Guest.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!guest) {
            return res.status(404).json({
                message: "Guest not found"
            });
        }

        res.status(200).json({
            message: "Guest updated successfully",
            guest
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid guest ID"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to update guest",
            error: error.message
        });
    }
};

const deleteGuest = async (req, res) => {
    try {
        const guest = await Guest.findByIdAndDelete(req.params.id);

        if (!guest) {
            return res.status(404).json({
                message: "Guest not found"
            });
        }

        res.status(200).json({
            message: "Guest deleted successfully"
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid guest ID"
            });
        }

        res.status(500).json({
            message: "Failed to delete guest",
            error: error.message
        });
    }
};

module.exports = {
    getGuests,
    getGuestById,
    createGuest,
    updateGuest,
    deleteGuest
};
