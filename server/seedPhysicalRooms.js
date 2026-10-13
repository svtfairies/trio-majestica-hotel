const mongoose = require("mongoose");
require("dotenv").config();

const Room = require("./models/Room");
const PhysicalRoom = require("./models/PhysicalRoom");

const seedPhysicalRooms = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected.");

        const roomTypes = await Room.find().sort({ createdAt: 1 });

        for (const roomType of roomTypes) {
            const totalRooms = Number(roomType.totalRooms) || 0;

            const existingRooms = await PhysicalRoom.find({
                roomTypeId: roomType._id
            }).sort({ roomNumber: 1 });

            const existingNumbers = new Set(
                existingRooms.map((room) => room.roomNumber)
            );

            const prefix = String(
                roomType.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
            );

            let createdCount = 0;

            for (let number = 1; number <= totalRooms; number++) {
                const roomNumber = `${prefix}-${String(number).padStart(3, "0")}`;

                if (existingNumbers.has(roomNumber)) {
                    continue;
                }

                await PhysicalRoom.create({
                    roomNumber,
                    roomTypeId: roomType._id,
                    floor: roomType.floor,
                    status: "Available"
                });

                createdCount++;
            }

            console.log(
                `${roomType.name}: ${createdCount} room records created; totalRooms = ${totalRooms}`
            );
        }

        console.log("Physical room seeding completed.");
    } catch (error) {
        console.error("Physical room seeding failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

seedPhysicalRooms();