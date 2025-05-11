import express from "express";
import dbConnect from "../../lib/dbconnect.js";
import User from "../../models/user.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

// GET /api/user - Fetch multiple users by IDs
router.get("/", async (req, res) => {
  try {
    await dbConnect();
    const { ids } = req.query; // Expecting a query parameter like ?ids=123,456,789

    if (!ids) {
      return res.status(400).json({ error: "No user IDs provided" });
    }

    const userIds = ids.split(",").map((id) => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
      return ObjectId(id);
    });

    const users = await User.find({ _id: { $in: userIds } }).select('-password');

    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Failed fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/user/:userId - Fetch a user by ID
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    await dbConnect();
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update email
router.put("/:userId/email", authMiddleware, async (req, res) => {
  try {
    await dbConnect();
    const { email } = req.body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.params.userId) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { email },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update password
router.put("/:userId/password", authMiddleware, async (req, res) => {
  try {
    await dbConnect();
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:userId - Delete a user by ID
router.delete("/:userId", authMiddleware, async (req, res) => {
  try {
    await dbConnect();
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;