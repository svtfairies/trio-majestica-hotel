const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        itemName: {
            type: String,
            required: true,
            trim: true,
        },

        quantityInStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        reorderStockLevel: {
            type: Number,
            required: true,
            min: 0,
            default: 100,
        },

        supplier: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        stockStatus: {
            type: String,
            enum: ["In Stock", "Low Stock", "Out of Stock"],
            required: true,
            default: "In Stock",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Inventory", inventorySchema);
