const mongoose = require("mongoose");

const physicalRoomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        roomTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },
        floor: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Available", "Occupied", "Maintenance", "Inactive"],
            default: "Available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PhysicalRoom", physicalRoomSchema);