const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, required: true, trim: true },
        image: { type: String, required: true, trim: true },
        bedType: { type: String, required: true, trim: true },
        capacity: { type: String, required: true, trim: true },
        roomSize: { type: String, required: true, trim: true },
        floor: { type: String, required: true, trim: true },
        view: { type: String, required: true, trim: true },
        bathroom: { type: String, required: true, trim: true },
        idealFor: { type: String, required: true, trim: true },
        highlight: { type: String, required: true, trim: true },
        experience: { type: String, required: true, trim: true },
        amenities: { type: [String], default: [] },
        inclusions: { type: [String], default: [] },
        totalRooms: { type: Number, required: true, min: 0 },
        pricePerNight: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["Available", "Fully Booked", "Maintenance", "Inactive"],
            default: "Available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Room", roomSchema);