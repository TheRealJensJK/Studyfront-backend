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
    const { active, completed, startedAt, timedStudy, endDate, questions, title, description, hasTermsAndConditions, termsAndConditions, hasDemographics } = req.body; // Extract fields from the request body
    const { id: studyId } = req.params;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    // Build the update object dynamically
    const updateFields = {};
    if (typeof active !== "undefined") updateFields.active = active;
    if (typeof completed !== "undefined") updateFields.completed = completed;
    if (timedStudy !== "undefined") updateFields.timedStudy = timedStudy;
    if (startedAt) updateFields.startedAt = startedAt;
    if (endDate) updateFields.endDate = endDate;
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (typeof hasTermsAndConditions !== "undefined") updateFields.hasTermsAndConditions = hasTermsAndConditions;
    if (termsAndConditions) updateFields.termsAndConditions = termsAndConditions;
    if (typeof hasDemographics !== "undefined") updateFields.hasDemographics = hasDemographics;

    // Append new questions instead of overwriting
    if (questions) {
      updateFields.$push = { questions: { $each: questions } };
    }

    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      updateFields, // Dynamically update fields
      { new: true } // Return the updated document
    );

    if (!updatedStudy) {
      return res.status(404).json({ error: "Study not found or unauthorized" });
    }

    res.json(updatedStudy); // Use the correct variable here
  } catch (error) {
    console.error("Error updating study:", error);
    res.status(500).json({ error: "Failed to update study" });
  }
});

export default router;