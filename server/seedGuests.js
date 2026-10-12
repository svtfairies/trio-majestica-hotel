
const mongoose = require("mongoose");
const Guest = require("./models/Guest");
require("dotenv").config();

const sampleGuests = [
    {
        firstName: "Paul",
        lastName: "Medallon",
        email: "paul.medallon@gmail.com",
        phone: "+639171000001",
        dateOfBirth: new Date("2004-03-21"),
        nationality: "Filipino",
        idType: "Passport",
        idNumber: "FILO-PASS-001",
        notes: "Prefers a non-smoking room"
    },
    {
        firstName: "James",
        lastName: "Wilson",
        email: "james.wilson@gmail.com",
        phone: "+639171000002",
        dateOfBirth: new Date("1988-09-25"),
        nationality: "American",
        idType: "Other",
        idNumber: "AMERICA-ID-002",
        notes: "Sample guest record"
    },
    {
        firstName: "Aisha",
        lastName: "Rahman",
        email: "aisha.rahman@gmail.com",
        phone: "+639171000003",
        dateOfBirth: new Date("1992-02-18"),
        nationality: "Malaysian",
        idType: "Passport",
        idNumber: "MALAY-PASS-003",
        notes: ""
    },

    {
        firstName: "Daniel",
        lastName: "Reyes",
        email: "daniel.reyes@gmail.com",
        phone: "+639171000004",
        dateOfBirth: new Date("1990-06-15"),
        nationality: "Filipino",
        idType: "National ID",
        idNumber: "FILO-ID-004",
        notes: "Prefers a room with a city view"
    },
    {
        firstName: "Sofia",
        lastName: "Cruz",
        email: "sofia.cruz@gmail.com",
        phone: "+639171000005",
        dateOfBirth: new Date("1997-11-03"),
        nationality: "Filipino",
        idType: "Passport",
        idNumber: "FILO-PASS-005",
        notes: "Vegetarian meal preference"
    },
    {
        firstName: "Ethan",
        lastName: "Miller",
        email: "ethan.miller@gmail.com",
        phone: "+639171000006",
        dateOfBirth: new Date("1985-02-21"),
        nationality: "American",
        idType: "Passport",
        idNumber: "AMERICAN-PASS-006",
        notes: "Frequent guest"
    },
    {
        firstName: "Isabella",
        lastName: "Garcia",
        email: "isabella.garcia@example.com",
        phone: "+639171000007",
        dateOfBirth: new Date("1993-08-09"),
        nationality: "Spanish",
        idType: "Passport",
        idNumber: "SPANISH-PASS-007",
        notes: "Prefers a king-size bed"
    },
    {
        firstName: "Liam",
        lastName: "Tan",
        email: "liam.tan@gmail.com",
        phone: "+639171000008",
        dateOfBirth: new Date("1991-12-17"),
        nationality: "Singaporean",
        idType: "Passport",
        idNumber: "SINGAPORE-PASS-008",
        notes: "Late check-in"
    },
    {
        firstName: "Olivia",
        lastName: "Lim",
        email: "olivia.lim@gmail.com",
        phone: "+639171000009",
        dateOfBirth: new Date("1996-03-28"),
        nationality: "Filipino",
        idType: "Driver's License",
        idNumber: "FILO-ID-009",
        notes: "Prefers a quiet room"
    },
    {
        firstName: "Noah",
        lastName: "Anderson",
        email: "noah.anderson@gmail.com",
        phone: "+639171000010",
        dateOfBirth: new Date("1987-07-11"),
        nationality: "Australian",
        idType: "Passport",
        idNumber: "AUSTRALIAN-PASS-010",
        notes: "Traveling for business"
    },
    {
        firstName: "Chloe",
        lastName: "Wong",
        email: "chloe.wong@gmail.com",
        phone: "+639171000011",
        dateOfBirth: new Date("1994-01-19"),
        nationality: "Malaysian",
        idType: "Passport",
        idNumber: "MALAY-PASS-011",
        notes: "Requests extra towels"
    },
    {
        firstName: "Gabriel",
        lastName: "Torres",
        email: "gabriel.torres@gmail.com",
        phone: "+639171000012",
        dateOfBirth: new Date("1989-10-06"),
        nationality: "Filipino",
        idType: "National ID",
        idNumber: "FILO-ID-012",
        notes: "Traveling with family"
    },
    {
        firstName: "Amara",
        lastName: "Patel",
        email: "amara.patel@gmail.com",
        phone: "+639171000013",
        dateOfBirth: new Date("1998-05-24"),
        nationality: "Indian",
        idType: "Passport",
        idNumber: "INDIA-PASS-013",
        notes: "Prefers a high-floor room"
    }

];

const seedGuests = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        await Guest.deleteMany({});
        await Guest.insertMany(sampleGuests);

        console.log("Sample guests seeded successfully!");
        await mongoose.disconnect();

        process.exit(0);
    } catch (error) {
        console.error("Failed to seed guests:", error);
        process.exitCode = 1;
    }
};

seedGuests();
