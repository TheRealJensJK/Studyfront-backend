import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        maxlength: 255,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "Invalid email"],
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);