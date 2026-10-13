const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required."],
            trim: true,
            minlength: [2, "Name must be at least 2 characters."],
            maxlength: [100, "Name cannot exceed 100 characters."]
        },
        email: {
            type: String,
            required: [true, "Email is required."],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."]
        },
        phone: {
            type: String,
            trim: true,
            default: "",
            maxlength: [25, "Contact number cannot exceed 25 characters."]
        },
        address: {
            type: String,
            trim: true,
            default: "",
            maxlength: [250, "Address cannot exceed 250 characters."]
        },
        password: {
            type: String,
            required: [true, "Password is required."],
            minlength: [6, "Password must be at least 6 characters."],
            select: false
        },
        passwordResetToken: {
            type: String,
            default: null,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            default: null,
            select: false
        },
        role: {
            type: String,
            enum: ["receptionist"],
            default: "receptionist",
            required: true
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            required: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);