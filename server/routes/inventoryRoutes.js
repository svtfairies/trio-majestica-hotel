const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Inventory = require("../models/Inventory");

const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0) {
        return "Out of Stock";
    }

    if (quantity <= reorderLevel) {
        return "Low Stock";
    }

    return "In Stock";
};

router.post("/", async (req, res) => {
    try {
        const {
            itemName,
            quantityInStock,
            reorderStockLevel,
            supplier,
            location,
        } = req.body;

        if (
            !itemName?.trim() ||
            quantityInStock === undefined ||
            !supplier?.trim() ||
            !location?.trim()
        ) {
            return res.status(400).json({
                message: "Please provide all required inventory fields.",
            });
        }

        const quantity = Number(quantityInStock);
        const reorderLevel =
            reorderStockLevel === undefined
                ? 100
                : Number(reorderStockLevel);

        if (
            !Number.isInteger(quantity) ||
            !Number.isInteger(reorderLevel) ||
            quantity < 0 ||
            reorderLevel < 0
        ) {
            return res.status(400).json({
                message: "Quantities must be non-negative whole numbers.",
            });
        }

        const inventory = await Inventory.create({
            itemName,
            quantityInStock: quantity,
            reorderStockLevel: reorderLevel,
            supplier,
            location,
            stockStatus: getStockStatus(quantity, reorderLevel),
        });

        return res.status(201).json({
            message: "Inventory item created successfully.",
            inventory,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create inventory item.",
            error: error.message,
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const inventory = await Inventory.find().sort({
            createdAt: -1,
        });

        return res.status(200).json(inventory);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch inventory.",
            error: error.message,
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid inventory ID.",
            });
        }

        const inventory = await Inventory.findById(id);

        if (!inventory) {
            return res.status(404).json({
                message: "Inventory item not found.",
            });
        }

        return res.status(200).json(inventory);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch inventory item.",
            error: error.message,
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid inventory ID.",
            });
        }

        const allowedFields = [
            "itemName",
            "quantityInStock",
            "reorderStockLevel",
            "supplier",
            "location",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (
            updates.itemName !== undefined &&
            (typeof updates.itemName !== "string" ||
                !updates.itemName.trim())
        ) {
            return res.status(400).json({
                message: "Item name cannot be empty.",
            });
        }

        if (
            updates.supplier !== undefined &&
            (typeof updates.supplier !== "string" ||
                !updates.supplier.trim())
        ) {
            return res.status(400).json({
                message: "Supplier cannot be empty.",
            });
        }

        if (
            updates.location !== undefined &&
            (typeof updates.location !== "string" ||
                !updates.location.trim())
        ) {
            return res.status(400).json({
                message: "Location cannot be empty.",
            });
        }

        for (const field of [
            "quantityInStock",
            "reorderStockLevel",
        ]) {
            if (updates[field] !== undefined) {
                const value = Number(updates[field]);

                if (
                    updates[field] === "" ||
                    !Number.isInteger(value) ||
                    value < 0
                ) {
                    return res.status(400).json({
                        message: `${field} must be a non-negative whole number.`,
                    });
                }

                updates[field] = value;
            }
        }

        if (updates.itemName !== undefined) {
            updates.itemName = updates.itemName.trim();
        }

        if (updates.supplier !== undefined) {
            updates.supplier = updates.supplier.trim();
        }

        if (updates.location !== undefined) {
            updates.location = updates.location.trim();
        }

        const existingItem = await Inventory.findById(id);

        if (!existingItem) {
            return res.status(404).json({
                message: "Inventory item not found.",
            });
        }

        const quantity =
            updates.quantityInStock ??
            existingItem.quantityInStock;

        const reorderLevel =
            updates.reorderStockLevel ??
            existingItem.reorderStockLevel;

        updates.stockStatus = getStockStatus(
            quantity,
            reorderLevel
        );

        const inventory = await Inventory.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({
            message: "Inventory updated successfully.",
            inventory,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update inventory.",
            error: error.message,
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid inventory ID.",
            });
        }

        const inventory = await Inventory.findByIdAndDelete(id);

        if (!inventory) {
            return res.status(404).json({
                message: "Inventory item not found.",
            });
        }

        return res.status(200).json({
            message: "Inventory item deleted successfully.",
            inventory,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete inventory item.",
            error: error.message,
        });
    }
});

module.exports = router;
