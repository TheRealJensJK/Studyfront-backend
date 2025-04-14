import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
    try {
        console.log("MONGO_URI:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "studyfront",
        });
        console.log("Database connected successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error connecting to database:", error.message);
        process.exit(1);
    }
}

testConnection();