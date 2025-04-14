import express from "express";
import { ObjectId } from "mongodb";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";

const router = express.Router();

// GET /api/studies/:id - Fetch a study by ID
router.get("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id: studyId } = req.params;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const study = await Study.findById(studyId);

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
    const { id: studyId } = req.params;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const deletedStudy = await Study.findByIdAndDelete(studyId);

    if (!deletedStudy) {
      return res.status(404).json({ error: "Study not found" });
    }

    res.status(200).json({ message: "Study deleted successfully" });
  } catch (error) {
    console.error("Error deleting study:", error);
    res.status(500).json({ error: "Failed to delete study" });
  }
});

// PUT /api/studies/:id - Update a study by ID
router.put("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { questions } = req.body;
    const { id: studyId } = req.params;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      { $set: { questions: questions } },
      { new: true }
    );

    if (!updatedStudy) {
      return res.status(404).json({ error: "Study not found" });
    }

    res.status(200).json(updatedStudy);
  } catch (error) {
    console.error("Error updating study:", error);
    res.status(500).json({ error: "Failed to update study questions" });
  }
});

export default router;