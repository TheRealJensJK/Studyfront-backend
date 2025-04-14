import mongoose from "mongoose";

let isConnected = false;

export default async function dbConnect() {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "studyfront",
        });
        isConnected = true;
        console.log("Database connected");
    } catch (error) {
        console.error("Error connecting to database", error);
        // Rethrow the error to propagate it
        throw error;
    }
}