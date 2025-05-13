import express from "express";
import { ObjectId } from "mongodb";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Add authMiddleware to protect all routes
router.use(authMiddleware);

// Helper function to check study ownership
async function checkStudyOwnership(studyId, userId) {
  const study = await Study.findOne({ _id: studyId, userId });
  if (!study) {
    throw new Error("Study not found or unauthorized");
  }
  return study;
}

// POST /api/studies/:id/questions - Add a new question to a study
router.post("/:id/questions", async (req, res) => {
  try {
    await dbConnect();
    const { type, data } = req.body;
    const { id: studyId } = req.params;

    // Check ownership
    await checkStudyOwnership(studyId, req.user._id);

    if (!type || !data) {
      return res.status(400).json({ error: "Type and data are required" });
    }

    const question = {
      _id: new ObjectId(),
      type,
      data,
    };

    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      { $push: { questions: question } },
      { new: true } // Return the updated document
    );

    if (!updatedStudy) {
      return res.status(404).json({ error: "Study not found" });
    }

    res.status(201).json(updatedStudy);
  } catch (error) {
    console.error("Error adding a question", error);
    res.status(error.message.includes("unauthorized") ? 403 : 500)
       .json({ error: error.message || "Failed to add the question" });
  }
});

// PUT /api/studies/:id/questions/:questionId - Update a question in a study
router.put("/:id/questions/:questionId", async (req, res) => {
  try {
    await dbConnect();
    const { data } = req.body; // Extract the data to update
    const { id: studyId, questionId } = req.params;

    // Check ownership
    await checkStudyOwnership(studyId, req.user._id);

    // Find the study and the specific question
    const study = await Study.findOne({ _id: studyId, "questions._id": new ObjectId(questionId) });
    if (!study) {
      return res.status(404).json({ error: "Study or question not found" });
    }

    // Find the existing question
    const question = study.questions.find((q) => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Merge the existing data with the new data
    question.data = { ...question.data, ...data };

    // Save the updated study
    const updatedStudy = await study.save();

    res.status(200).json(updatedStudy);
  } catch (error) {
    console.error("Failed to update the question", error);
    res.status(error.message.includes("unauthorized") ? 403 : 500).json({
      error: error.message || "Failed to update the question",
    });
  }
});

// DELETE /api/studies/:id/questions/:questionId - Delete a question from a study
router.delete("/:id/questions/:questionId", async (req, res) => {
  try {
    await dbConnect();
    const { id: studyId, questionId } = req.params;

    // Check ownership
    await checkStudyOwnership(studyId, req.user._id);

    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      { $pull: { questions: { _id: new ObjectId(questionId) } } },
      { new: true }
    );

    if (!updatedStudy) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(updatedStudy);
  } catch (error) {
    console.error("Error deleting a question", error);
    res.status(error.message.includes("unauthorized") ? 403 : 500)
       .json({ error: error.message || "Failed to delete the question" });
  }
});

// GET /api/studies/:id/questions/:questionId - Get a specific question
router.get("/:id/questions/:questionId", async (req, res) => {
  try {
    await dbConnect();
    const { id: studyId, questionId } = req.params;

    // Check ownership
    await checkStudyOwnership(studyId, req.user._id);

    const study = await Study.findOne({
      _id: studyId,
      "questions._id": new ObjectId(questionId),
    });

    if (!study) {
      return res.status(404).json({ error: "Study or question not found" });
    }

    const question = study.questions.find(
      (q) => q._id.toString() === questionId
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json(question);
  } catch (error) {
    console.error("Error getting the question", error);
    res.status(error.message.includes("unauthorized") ? 403 : 500)
       .json({ error: error.message || "Failed to get question" });
  }
});

// PUT /api/studies/:id/questions - Replace the entire questions array
router.put("/:id/questions", async (req, res) => {
  try {
    await dbConnect();
    const { questions } = req.body; // Extract the questions array from the request body
    const { id: studyId } = req.params;

    // Check ownership
    await checkStudyOwnership(studyId, req.user._id);

    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: "Questions must be an array" });
    }

    // Ensure each question has a valid _id
    const processedQuestions = questions.map((question) => {
      if (!question._id) {
        question._id = new ObjectId(); // Generate a new _id if not provided
      }
      return question;
    });

    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      { $set: { questions: processedQuestions } }, // Replace the entire questions array
      { new: true } // Return the updated document
    );

    if (!updatedStudy) {
      return res.status(404).json({ error: "Study not found" });
    }

    res.status(200).json(updatedStudy);
  } catch (error) {
    console.error("Error updating questions", error);
    res.status(error.message.includes("unauthorized") ? 403 : 500)
       .json({ error: error.message || "Failed to update questions" });
  }
});

export default router;