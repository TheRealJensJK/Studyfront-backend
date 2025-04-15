import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/dbconnect.js";
import User from "../../../models/user.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    await dbConnect(); // Ensure the database is connected
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Send token in the Authorization header
    res
      .header("Authorization", `Bearer ${token}`)
      .status(200)
      .json({ message: "User logged in", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Error logging in user" });
  }
});

export default router;