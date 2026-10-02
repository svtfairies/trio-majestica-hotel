const mongoose = require("mongoose");
require("dotenv").config();

const Room = require("./models/Room");

const rooms = [
    {
        name: "Classic Twin Room",
        description: "A refined and comfortable room featuring two single beds, elegant interiors, and essential comforts for a relaxing stay.",
        image: "https://images.unsplash.com/photo-1741506131058-533fcf894483?auto=format&fit=crop&w=1400&q=85",
        bedType: "2 Single Beds",
        capacity: "2 pax",
        roomSize: "32 sqm",
        floor: "3rd - 5th Floor",
        view: "City View",
        bathroom: "Walk-in Rain Shower",
        idealFor: "Friends, colleagues, and business travelers",
        highlight: "Two separate beds with a spacious work area",
        experience: "A practical yet refined retreat for guests who value comfort, privacy, and flexibility.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "In-Room Safe",
            "Work Desk",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast",
            "Daily Housekeeping",
            "Complimentary Bottled Water",
            "Welcome Refreshments"
        ],
        totalRooms: 20,
        pricePerNight: 8500,
        status: "Available"
    },
    {
        name: "Premier Standard Room",
        description: "A thoughtfully appointed room offering enhanced comfort, modern furnishings, and convenient amenities for a pleasant stay.",
        image: "https://images.unsplash.com/photo-1779078652928-6d941878d32e?auto=format&fit=crop&w=1400&q=85",
        bedType: "1 Queen Bed",
        capacity: "2 pax",
        roomSize: "38 sqm",
        floor: "5th - 7th Floor",
        view: "Garden and City View",
        bathroom: "Marble Bathroom with Rain Shower",
        idealFor: "Couples and leisure travelers",
        highlight: "Elegant queen bedroom with dedicated relaxation corner",
        experience: "A calm and sophisticated setting for couples and travelers looking for a more polished stay.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "Coffee and Tea Station",
            "In-Room Safe",
            "Work Desk",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast",
            "Premium Toiletries",
            "Daily Housekeeping",
            "Complimentary Bottled Water"
        ],
        totalRooms: 15,
        pricePerNight: 10500,
        status: "Available"
    },
    {
        name: "Trio Deluxe Room",
        description: "An elegant and spacious room featuring a king bed, refined furnishings, and premium comforts for an elevated hotel experience.",
        image: "https://images.unsplash.com/photo-1746549854913-3be88c9e4352?auto=format&fit=crop&w=1400&q=85",
        bedType: "1 King Bed",
        capacity: "2 pax",
        roomSize: "46 sqm",
        floor: "7th - 9th Floor",
        view: "Panoramic City View",
        bathroom: "Marble Bathroom with Rain Shower",
        idealFor: "Couples and premium leisure travelers",
        highlight: "King bedroom with panoramic city views",
        experience: "An elevated retreat where generous space, refined design, and city views come together.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "Coffee and Tea Station",
            "In-Room Safe",
            "Work Desk",
            "Bathrobe and Slippers",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast",
            "Premium Toiletries",
            "Welcome Fruit Platter",
            "Evening Turndown Service",
            "Complimentary Bottled Water"
        ],
        totalRooms: 25,
        pricePerNight: 13500,
        status: "Available"
    },
    {
        name: "Family Atelier Suite",
        description: "A spacious suite designed for families, combining comfortable sleeping arrangements with generous living space and modern amenities.",
        image: "https://images.unsplash.com/photo-1648383228240-6ed939727ad6?auto=format&fit=crop&w=1400&q=85",
        bedType: "2 Queen Beds",
        capacity: "4 pax",
        roomSize: "68 sqm",
        floor: "6th - 8th Floor",
        view: "Garden and Pool View",
        bathroom: "Large Bathroom with Separate Shower",
        idealFor: "Families and small groups",
        highlight: "Spacious family layout with separate sitting area",
        experience: "A comfortable home-away-from-home designed to give families more room to relax and reconnect.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "Coffee and Tea Station",
            "In-Room Safe",
            "Work Desk",
            "Sitting Area",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast for 4",
            "Family Welcome Amenities",
            "Daily Housekeeping",
            "Complimentary Bottled Water",
            "Premium Toiletries"
        ],
        totalRooms: 15,
        pricePerNight: 18500,
        status: "Available"
    },
    {
        name: "Prestige Junior Suite",
        description: "A sophisticated suite featuring a king bed and separate sitting area, offering additional space and refined comfort.",
        image: "https://images.unsplash.com/photo-1776763018972-588e27bf6511?auto=format&fit=crop&w=1400&q=85",
        bedType: "1 King Bed + Sofa",
        capacity: "3 pax",
        roomSize: "58 sqm",
        floor: "9th - 11th Floor",
        view: "Skyline View",
        bathroom: "Marble Bathroom with Rain Shower and Soaking Tub",
        idealFor: "Couples, executives, and extended stays",
        highlight: "Separate sitting area with premium lounge furnishings",
        experience: "A private and sophisticated suite designed for guests who desire additional space and understated luxury.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "Coffee and Tea Station",
            "In-Room Safe",
            "Separate Sitting Area",
            "Work Desk",
            "Bathrobe and Slippers",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast",
            "Evening Turndown Service",
            "Premium Toiletries",
            "Welcome Amenity",
            "Complimentary Bottled Water"
        ],
        totalRooms: 10,
        pricePerNight: 24000,
        status: "Available"
    },
    {
        name: "Luxury Executive Suite",
        description: "An upscale suite offering a separate living area, premium furnishings, and enhanced amenities for business and leisure travelers.",
        image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=85",
        bedType: "1 King Bed + Sofa",
        capacity: "3 pax",
        roomSize: "82 sqm",
        floor: "11th - 13th Floor",
        view: "Panoramic Skyline View",
        bathroom: "Luxury Marble Bathroom with Rain Shower and Bathtub",
        idealFor: "Executives, VIP guests, and long stays",
        highlight: "Separate living room and executive workspace",
        experience: "A sophisticated private residence in the hotel, balancing productivity, relaxation, and personalized comfort.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "Coffee and Tea Station",
            "In-Room Safe",
            "Separate Living Area",
            "Executive Work Desk",
            "Bathrobe and Slippers",
            "Premium Toiletries",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast",
            "Executive Lounge Access",
            "Evening Turndown Service",
            "Premium Toiletries",
            "Welcome Amenity",
            "Complimentary Bottled Water"
        ],
        totalRooms: 10,
        pricePerNight: 32000,
        status: "Available"
    },
    {
        name: "Grand Presidential Suite",
        description: "The hotel's most prestigious accommodation, featuring expansive living and dining spaces, elegant furnishings, and premium amenities.",
        image: "https://images.unsplash.com/photo-1740324351912-b9189685ab1a?auto=format&fit=crop&w=1400&q=85",
        bedType: "2 King Beds + Sofa",
        capacity: "4 pax",
        roomSize: "180 sqm",
        floor: "14th Floor",
        view: "360° Panoramic Skyline View",
        bathroom: "Luxury Marble Bathroom with Bathtub and Rain Shower",
        idealFor: "VIP guests, families, and special occasions",
        highlight: "Private residence-style layout with separate dining and living spaces",
        experience: "The ultimate Trio Majestica experience, offering expansive private spaces, exceptional views, and elevated hospitality.",
        amenities: [
            "Complimentary Wi-Fi",
            "Air Conditioning",
            "Smart TV",
            "Mini Refrigerator",
            "Premium Coffee and Tea Station",
            "In-Room Safe",
            "Separate Living and Dining Area",
            "Executive Work Desk",
            "Bathrobe and Slippers",
            "Premium Toiletries",
            "Bathtub",
            "Private Bathroom"
        ],
        inclusions: [
            "Daily Breakfast for 4",
            "Private Butler Service",
            "Airport Transfer",
            "Executive Lounge Access",
            "Evening Turndown Service",
            "Welcome Champagne",
            "Premium Welcome Amenity",
            "Complimentary Bottled Water"
        ],
        totalRooms: 5,
        pricePerNight: 55000,
        status: "Available"
    }
];

const seedRooms = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        await Room.deleteMany({});

        await Room.insertMany(rooms);

        console.log("Rooms seeded successfully.");
        console.log("Total rooms: 100");

        await mongoose.disconnect();

        process.exit(0);
    } catch (error) {
        console.error("Room seed error:", error);

        process.exit(1);
    }
};

seedRooms();