
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingReference: {
            type: String,
            unique: true,
            trim: true
        },
        guestName: {
            type: String,
            required: [true, "Guest name is required."],
            trim: true,
            maxlength: 100
        },
        guestEmail: {
            type: String,
            required: [true, "Guest email is required."],
            lowercase: true,
            trim: true
        },
        guestPhone: {
            type: String,
            required: [true, "Guest phone number is required."],
            trim: true
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Room is required."]
        },
        checkIn: {
            type: Date,
            required: [true, "Check-in date is required."]
        },
        checkOut: {
            type: Date,
            required: [true, "Check-out date is required."]
        },
        adults: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        children: {
            type: Number,
            min: 0,
            default: 0
        },
        totalNights: {
            type: Number,
            min: 1,
            required: true
        },
        totalAmount: {
            type: Number,
            min: 0,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["Unpaid", "Partially Paid", "Paid", "Refunded"],
            default: "Unpaid"
        },
        bookingStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Checked In",
                "Checked Out",
                "Cancelled",
                "No Show"
            ],
            default: "Pending"
        },
        specialRequests: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        roomsBooked: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        roomNumbers: {
            type: [String],
            required: true,
            validate: {
                validator: function (numbers) {
                    return (
                        Array.isArray(numbers) &&
                        numbers.length === this.roomsBooked &&
                        numbers.every((number) => String(number).trim() !== "") &&
                        new Set(numbers).size === numbers.length
                    );
                },
                message: "Selected room numbers must match the number of rooms booked."
            }
        },
    },
    {
        timestamps: true
    }
);

bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ guestName: 1 });

bookingSchema.pre("validate", function () {
    if (this.checkIn && this.checkOut) {
        const checkIn = new Date(this.checkIn);
        const checkOut = new Date(this.checkOut);

        if (checkOut <= checkIn) {
            this.invalidate("checkOut", "Check-out must be after check-in.");
            return;
        }

        this.totalNights = Math.ceil(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
        );
    }

    if (!this.bookingReference) {
        this.bookingReference =
            "TM-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    }
});

module.exports = mongoose.model("Booking", bookingSchema);