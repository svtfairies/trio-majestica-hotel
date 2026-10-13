const mongoose = require("mongoose");
const Inventory = require("./models/Inventory");
require("dotenv").config();

const sampleInventory = [
    { itemName: "Bath Towels", quantityInStock: 250, reorderStockLevel: 100, supplier: "ABC Textile Supply", location: "Linen Storage", stockStatus: "In Stock" },
    { itemName: "Bed Sheets", quantityInStock: 180, reorderStockLevel: 100, supplier: "ABC Textile Supply", location: "Linen Storage", stockStatus: "In Stock" },
    { itemName: "Pillowcases", quantityInStock: 90, reorderStockLevel: 100, supplier: "ABC Textile Supply", location: "Linen Storage", stockStatus: "Low Stock" },
    { itemName: "Blankets", quantityInStock: 120, reorderStockLevel: 100, supplier: "Comfort Home Supplies", location: "Linen Storage", stockStatus: "In Stock" },
    { itemName: "Comforters", quantityInStock: 0, reorderStockLevel: 100, supplier: "Comfort Home Supplies", location: "Linen Storage", stockStatus: "Out of Stock" },
    { itemName: "Mattress Protectors", quantityInStock: 110, reorderStockLevel: 100, supplier: "ABC Textile Supply", location: "Linen Storage", stockStatus: "In Stock" },
    { itemName: "Hand Towels", quantityInStock: 75, reorderStockLevel: 100, supplier: "ABC Textile Supply", location: "Linen Storage", stockStatus: "Low Stock" },
    { itemName: "Bath Mats", quantityInStock: 140, reorderStockLevel: 100, supplier: "ABC Textile Supply", location: "Linen Storage", stockStatus: "In Stock" },
    { itemName: "Pillow Inserts", quantityInStock: 0, reorderStockLevel: 100, supplier: "Comfort Home Supplies", location: "Linen Storage", stockStatus: "Out of Stock" },
    { itemName: "Curtains", quantityInStock: 115, reorderStockLevel: 100, supplier: "HomeStyle Trading", location: "Maintenance Room", stockStatus: "In Stock" },

    { itemName: "Shampoo Bottles", quantityInStock: 300, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "In Stock" },
    { itemName: "Conditioner Bottles", quantityInStock: 160, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "In Stock" },
    { itemName: "Soap Bars", quantityInStock: 85, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "Low Stock" },
    { itemName: "Toilet Paper Rolls", quantityInStock: 75, reorderStockLevel: 100, supplier: "PaperPlus Trading", location: "Supply Room", stockStatus: "Low Stock" },
    { itemName: "Toothbrush Kits", quantityInStock: 150, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "In Stock" },
    { itemName: "Toothpaste Kits", quantityInStock: 0, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "Out of Stock" },
    { itemName: "Guest Slippers", quantityInStock: 70, reorderStockLevel: 100, supplier: "Comfort Home Supplies", location: "Housekeeping Room", stockStatus: "Low Stock" },
    { itemName: "Shower Caps", quantityInStock: 130, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "In Stock" },
    { itemName: "Dental Floss Kits", quantityInStock: 105, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "In Stock" },
    { itemName: "Vanity Kits", quantityInStock: 95, reorderStockLevel: 100, supplier: "CleanCare Supplies", location: "Housekeeping Room", stockStatus: "Low Stock" },

    { itemName: "Bottled Water", quantityInStock: 200, reorderStockLevel: 100, supplier: "FreshDrinks Distributor", location: "Main Storage", stockStatus: "In Stock" },
    { itemName: "Coffee Sachets", quantityInStock: 95, reorderStockLevel: 100, supplier: "Daily Brew Supplier", location: "Kitchen Storage", stockStatus: "Low Stock" },
    { itemName: "Tea Bags", quantityInStock: 160, reorderStockLevel: 100, supplier: "Daily Brew Supplier", location: "Kitchen Storage", stockStatus: "In Stock" },
    { itemName: "Sugar Sachets", quantityInStock: 110, reorderStockLevel: 100, supplier: "Daily Brew Supplier", location: "Kitchen Storage", stockStatus: "In Stock" },
    { itemName: "Creamer Sachets", quantityInStock: 80, reorderStockLevel: 100, supplier: "Daily Brew Supplier", location: "Kitchen Storage", stockStatus: "Low Stock" },
    { itemName: "Orange Juice Cartons", quantityInStock: 125, reorderStockLevel: 100, supplier: "FreshDrinks Distributor", location: "Kitchen Storage", stockStatus: "In Stock" },
    { itemName: "Breakfast Cereal Boxes", quantityInStock: 0, reorderStockLevel: 100, supplier: "Morning Foods Trading", location: "Kitchen Storage", stockStatus: "Out of Stock" },
    { itemName: "Biscuit Packs", quantityInStock: 145, reorderStockLevel: 100, supplier: "Morning Foods Trading", location: "Kitchen Storage", stockStatus: "In Stock" },
    { itemName: "Mineral Water Gallons", quantityInStock: 90, reorderStockLevel: 100, supplier: "FreshDrinks Distributor", location: "Main Storage", stockStatus: "Low Stock" },
    { itemName: "Chocolate Drink Sachets", quantityInStock: 135, reorderStockLevel: 100, supplier: "Daily Brew Supplier", location: "Kitchen Storage", stockStatus: "In Stock" },

    { itemName: "Dishwashing Liquid", quantityInStock: 60, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "Low Stock" },
    { itemName: "Floor Cleaner", quantityInStock: 130, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "In Stock" },
    { itemName: "Disinfectant", quantityInStock: 80, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "Low Stock" },
    { itemName: "Garbage Bags", quantityInStock: 220, reorderStockLevel: 100, supplier: "EcoPack Trading", location: "Supply Room", stockStatus: "In Stock" },
    { itemName: "Glass Cleaner", quantityInStock: 115, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "In Stock" },
    { itemName: "Toilet Bowl Cleaner", quantityInStock: 0, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "Out of Stock" },
    { itemName: "Laundry Detergent", quantityInStock: 140, reorderStockLevel: 100, supplier: "WashWell Supplies", location: "Laundry Room", stockStatus: "In Stock" },
    { itemName: "Fabric Softener", quantityInStock: 85, reorderStockLevel: 100, supplier: "WashWell Supplies", location: "Laundry Room", stockStatus: "Low Stock" },
    { itemName: "Cleaning Sponges", quantityInStock: 170, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "In Stock" },
    { itemName: "Rubber Gloves", quantityInStock: 95, reorderStockLevel: 100, supplier: "Sparkle Cleaning Supply", location: "Cleaning Storage", stockStatus: "Low Stock" },

    { itemName: "Light Bulbs", quantityInStock: 45, reorderStockLevel: 100, supplier: "BrightTech Hardware", location: "Maintenance Room", stockStatus: "Low Stock" },
    { itemName: "AA Batteries", quantityInStock: 105, reorderStockLevel: 100, supplier: "BrightTech Hardware", location: "Maintenance Room", stockStatus: "In Stock" },
    { itemName: "LED Bulbs", quantityInStock: 150, reorderStockLevel: 100, supplier: "BrightTech Hardware", location: "Maintenance Room", stockStatus: "In Stock" },
    { itemName: "Electrical Tape", quantityInStock: 90, reorderStockLevel: 100, supplier: "BrightTech Hardware", location: "Maintenance Room", stockStatus: "Low Stock" },
    { itemName: "Screwdriver Sets", quantityInStock: 110, reorderStockLevel: 100, supplier: "BrightTech Hardware", location: "Maintenance Room", stockStatus: "In Stock" },
    { itemName: "Door Handles", quantityInStock: 0, reorderStockLevel: 100, supplier: "BuildRight Hardware", location: "Maintenance Room", stockStatus: "Out of Stock" },
    { itemName: "Air Conditioner Filters", quantityInStock: 120, reorderStockLevel: 100, supplier: "BuildRight Hardware", location: "Maintenance Room", stockStatus: "In Stock" },
    { itemName: "Plumbing Washers", quantityInStock: 75, reorderStockLevel: 100, supplier: "BuildRight Hardware", location: "Maintenance Room", stockStatus: "Low Stock" },
    { itemName: "Paint Cans", quantityInStock: 105, reorderStockLevel: 100, supplier: "BuildRight Hardware", location: "Maintenance Room", stockStatus: "In Stock" },
    { itemName: "Extension Cords", quantityInStock: 125, reorderStockLevel: 100, supplier: "BrightTech Hardware", location: "Maintenance Room", stockStatus: "In Stock" }
];

const seedInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        await Inventory.deleteMany({});
        await Inventory.insertMany(sampleInventory);

        console.log(`${sampleInventory.length} inventory items seeded successfully!`);
    } catch (error) {
        console.error("Failed to seed inventory:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedInventory();
