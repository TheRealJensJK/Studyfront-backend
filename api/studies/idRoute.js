import express from "express";
import { ObjectId } from "mongodb";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/studies/:id - Fetch a study by ID
router.get("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id: studyId } = req.params;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    // Add user check
    const study = await Study.findOne({
      _id: studyId,
      userId: req.user._id
    });

    if (!study) {
      return res.status(404).json({ error: "Study not found" });
    }

    res.status(200).json(study);
  } catch (error) {
    console.error("Failed fetching study:", error);
    res.status(500).json({ error: "Failed to fetch study" });
  }
});

// DELETE /api/studies/:id - Delete a study by ID
router.delete("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const study = await Study.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!study) {
      return res.status(404).json({ error: "Study not found or unauthorized" });
    }

    res.json({ message: "Study deleted successfully" });
  } catch (error) {
    console.error("Error deleting study:", error);
    res.status(500).json({ error: "Failed to delete study" });
  }
});

// PUT /api/studies/:id - Update a study by ID
router.put("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id } = req.params;
    const { active, completed } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const updateData = {};
    if (typeof active !== "undefined") updateData.active = active;
    if (typeof completed !== "undefined") updateData.completed = completed;

    const study = await Study.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updateData },
      { new: true }
    );

    if (!study) {
      return res.status(404).json({ error: "Study not found or unauthorized" });
    }

    res.json(study);
  } catch (error) {
    console.error("Error updating study:", error);
    res.status(500).json({ error: "Failed to update study" });
  }
});

export default router;