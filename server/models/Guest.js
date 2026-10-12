
const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        dateOfBirth: {
            type: Date,
            default: null
        },
        nationality: {
            type: String,
            trim: true,
            default: ""
        },
        idType: {
            type: String,
            enum: [
                "Passport",
                "National ID",
                "Driver's License",
                "Other",
                ""
            ],
            default: ""
        },
        idNumber: {
            type: String,
            trim: true,
            default: ""
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        },
        addedDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Guest", guestSchema);
