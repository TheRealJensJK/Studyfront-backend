import express from "express";
import { ObjectId } from "mongodb";
import dbConnect from "../../lib/dbconnect.js";
import user from "../../models/user.js";

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

    const users = await user.find({ _id: { $in: userIds } });

    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Failed fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/user/:id - Fetch a user by ID
router.get("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id: userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const User = await user.findById(userId);

    if (!User) {
      return res.status(404).json({ error: "user not found" });
    }

    res.status(200).json(User);
  } catch (error) {
    console.error("Failed fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// DELETE /api/users/:id - Delete a user by ID
router.delete("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id: userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const deletedUser = await user.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;