import express from "express";
import mongoose from "mongoose";
import Response from "../../models/response.js";
import Study from "../../models/study.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/responses/submit
 * @description Submit responses for a study
 * @access Public
 */
router.post("/submit", async (req, res) => {
  try {
    const { studyId, participantId, startTime, endTime, responses } = req.body;

    // Validate required fields
    if (!studyId || !participantId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate study ID format
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      return res.status(400).json({ message: "Invalid study ID format" });
    }

    // Check for existing response from this participant
    const existingResponse = await Response.findOne({ studyId, participantId });
    if (existingResponse) {
      return res.status(400).json({ message: "Participant has already submitted responses for this study" });
    }

    // Validate study exists and get questions
    const study = await Study.findById(studyId);
    if (!study) {
      return res.status(404).json({ message: "Study not found" });
    }

    // Validate timestamps
    const currentTime = new Date();
    const parsedStartTime = startTime ? new Date(startTime) : currentTime;
    const parsedEndTime = endTime ? new Date(endTime) : currentTime;

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ message: "Invalid timestamp format" });
    }

    if (parsedEndTime < parsedStartTime) {
      return res.status(400).json({ message: "End time cannot be before start time" });
    }

    // Validate responses format and question IDs
    const studyQuestions = study.questions.reduce((acc, q) => {
      acc[q._id.toString()] = q;
      return acc;
    }, {});
    
    for (const response of responses) {
      if (!response.questionId || response.response === undefined) {
        return res.status(400).json({ 
          message: "Each response must include questionId and response" 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(response.questionId)) {
        return res.status(400).json({ 
          message: `Invalid question ID format: ${response.questionId}` 
        });
      }

      const question = studyQuestions[response.questionId.toString()];
      if (!question) {
        return res.status(400).json({ 
          message: `Question ID ${response.questionId} does not belong to this study` 
        });
      }

      // Validate response type matches question type
      if (!validateResponseType(response.response, question.type)) {
        return res.status(400).json({ 
          message: `Invalid response type for question ${response.questionId}` 
        });
      }

      const responseTimestamp = response.timestamp ? new Date(response.timestamp) : currentTime;
      if (isNaN(responseTimestamp.getTime())) {
        return res.status(400).json({ 
          message: `Invalid timestamp for question ${response.questionId}` 
        });
      }
    }

    // Create new response record
    const newResponse = new Response({
      studyId,
      participantId,
      startTime: parsedStartTime.toISOString(),
      endTime: parsedEndTime.toISOString(),
      responses: responses.map(r => ({
        questionId: r.questionId,
        response: typeof r.response === 'string' ? r.response.trim() : r.response,
        timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : currentTime.toISOString()
      }))
    });

    await newResponse.save();

    res.status(201).json({ message: "Responses submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "Failed to submit responses",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/responses/study/:studyId
 * @description Get all responses for a study
 * @access Private
 */
router.get("/study/:studyId", authMiddleware, async (req, res) => {
  try {
    const studyId = req.params.studyId;
    
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      return res.status(400).json({ message: "Invalid study ID format" });
    }
    
    const responses = await Response.find({ studyId })
      .populate('studyId', 'title description')
      .lean();
      
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "Failed to fetch study responses",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Helper function to validate response types
function validateResponseType(response, questionType) {
  switch (questionType) {
    case 'text':
      return typeof response === 'string';
    case 'number':
      return typeof response === 'number' && !isNaN(response);
    case 'boolean':
      return typeof response === 'boolean';
    case 'multiChoice':
      return Array.isArray(response) && response.every(item => typeof item === 'string');
    default:
      return true;
  }
}

export default router;
