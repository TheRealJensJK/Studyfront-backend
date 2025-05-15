import express from "express";
import mongoose from "mongoose";
import Response from "../../models/response.js";
import Study from "../../models/study.js";
import { v4 as uuidv4 } from 'uuid'; // Make sure to install this package

const router = express.Router();

/**
 * @route POST /api/responses/submit
 * @description Submit responses for a study
 * @access Public
 */
router.post("/submit", async (req, res) => {
  try {
    const { studyId, participantId, visitorId, startTime, endTime, responses, demographics } = req.body;

    // Add validation for visitorId
    if (!studyId || !participantId || !visitorId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate study ID format
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      return res.status(400).json({ message: "Invalid study ID format" });
    }

    // Check for existing participation with visitorId or cookie
    const existingResponse = await Response.findOne({ 
      studyId,
      visitorId: visitorId
    });
    
    // Check completion cookie
    const completionCookie = req.cookies[`study_completed_${studyId}`];
    
    if (existingResponse || completionCookie) {
      return res.status(409).json({ message: "Participant has already submitted responses for this study" });
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

    // Generate a unique completion token
    const completionToken = uuidv4();
                    
    const newResponse = new Response({
      studyId,
      participantId,
      visitorId,
      completionToken,
      startTime: parsedStartTime.toISOString(),
      endTime: parsedEndTime.toISOString(),
      demographics: demographics || {},
      responses: responses.map(r => ({
        questionId: r.questionId,
        response: typeof r.response === 'string' ? r.response.trim() : r.response,
        timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : currentTime.toISOString()
      }))
    });

    await newResponse.save();

    // Set completion cookie
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    res.cookie(`study_completed_${studyId}`, completionToken, {
      maxAge: oneYear,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

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
router.get("/study/:studyId", async (req, res) => {
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

// Simplified check-participation endpoint
router.post("/check-participation", async (req, res) => {
  try {
    const { studyId, visitorId } = req.body;

    // Validate required fields
    if (!studyId || !visitorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate study ID format
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      return res.status(400).json({ message: "Invalid study ID format" });
    }
    
    // Check if this visitor has already submitted using visitorId or completion cookie
    const existingResponse = await Response.findOne({
      studyId,
      visitorId: visitorId
    });
    
    // Check completion cookie
    const completionCookie = req.cookies[`study_completed_${studyId}`];
    
    // Simplified response with combined check
    res.json({ hasParticipated: !!existingResponse || !!completionCookie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "Failed to check participation status",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Helper function to validate response types with more flexibility
function validateResponseType(response, questionType) {  
  if (response === null || response === undefined) {
    return false;
  }

  if (typeof response === 'object' && !Array.isArray(response) && response !== null) {
    return true;
  }
  
  if (Array.isArray(response)) {
    return true;
  }
  switch (questionType) {
    case 'text':
      return typeof response === 'string' || typeof response === 'object';
    case 'number':
      return typeof response === 'number' && !isNaN(response);
    case 'boolean':
      return typeof response === 'boolean';
    case 'multiChoice':
      return Array.isArray(response) || typeof response === 'string';
    default:
      return true;
  }
}

export default router;
