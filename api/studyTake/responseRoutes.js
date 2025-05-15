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
    const { studyId, participantId, visitorId, startTime, endTime, responses } = req.body;

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

/**
 * @route GET /api/responses/download/:studyId
 * @description Download formatted responses for a study
 * @access Private
 */
router.get("/download/:studyId", async (req, res) => {
  try {
    const studyId = req.params.studyId;
    
    if (!mongoose.Types.ObjectId.isValid(studyId)) {
      return res.status(400).json({ message: "Invalid study ID format" });
    }
    
    // Get study details
    const study = await Study.findById(studyId).lean();
    if (!study) {
      return res.status(404).json({ message: "Study not found" });
    }
    
    // Get all responses for this study
    const responses = await Response.find({ studyId })
      .lean()
      .sort({ createdAt: 1 });
    
    // Create a map of question IDs to question details for quick lookup
    const questionMap = {};
    study.questions.forEach(question => {
      questionMap[question._id.toString()] = {
        title: question.data?.title || question.data?.prompt || "Untitled Question",
        label: question.data?.title || question.data?.prompt || `Question ${question._id}`,
        type: question.type
      };
    });
      
    // Format the response data
    const formattedData = {
      study: {
        id: study._id.toString(),
        title: study.title,
        description: study.description,
        createdAt: study.createdAt,
        hasTermsAndConditions: study.hasTermsAndConditions,
        active: study.active,
        completed: study.completed
      },
      questions: study.questions.map(question => ({
        id: question._id.toString(),
        title: question.data?.title || question.data?.prompt || "Untitled Question",
        label: question.data?.title || question.data?.prompt || `Question ${question._id}`,
        type: question.type,
        artifacts: (question.data?.artifacts || []).map(artifact => ({
          id: artifact.id,
          label: artifact.label || artifact.title || artifact.name || "Unnamed artifact",
          name: artifact.name,
          contentType: artifact.contentType
        })),
        groups: formatQuestionGroups(question)
      })),
      responses: {
        all: responses.map(response => formatResponseData(response, questionMap)),
        byParticipant: groupResponsesByParticipant(responses, questionMap),
        byQuestion: groupResponsesByQuestion(responses, study.questions)
      },
      metadata: {
        totalResponses: responses.length,
        exportedAt: new Date().toISOString()
      }
    };
    
    res.json(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "Failed to format and download responses",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Helper function to format question groups based on question type
function formatQuestionGroups(question) {
  const type = question.type?.toLowerCase();
  const data = question.data || {};
  
  // Handle different question types
  switch(type) {
    case 'multiplechoice':
    case 'multiple choice':
      return (data.choiceGroups || []).map(group => ({
        id: group.id,
        label: group.label || group.name || "Choice group",
        options: group.options?.map(option => ({
          id: option.id,
          text: option.text,
          label: option.label || option.text
        })) || []
      }));
    case 'checkbox':
      return (data.checkboxGroups || []).map(group => ({
        id: group.id,
        label: group.label || group.name || "Checkbox group",
        options: group.options?.map(option => ({
          id: option.id,
          text: option.text,
          label: option.label || option.text
        })) || []
      }));
    case 'ratingscale':
    case 'rating':
    case 'rating scale':
      return (data.ratingScales || []).map(scale => ({
        id: scale.id,
        label: scale.label || scale.name || "Rating scale",
        min: scale.min,
        max: scale.max
      }));
    case 'dropdown':
      return (data.dropdowns || []).map(dropdown => ({
        id: dropdown.id,
        label: dropdown.label || dropdown.name || "Dropdown",
        options: dropdown.options?.map(option => ({
          id: option.id,
          text: option.text,
          label: option.label || option.text
        })) || []
      }));
    case 'ranking':
      return (data.rankGroups || []).map(group => ({
        id: group.id,
        label: group.label || group.name || "Ranking group",
        options: group.options?.map(option => ({
          id: option.id,
          text: option.text,
          label: option.label || option.text
        })) || []
      }));
    case 'matrix':
      return (data.matrixGroups || []).map(group => ({
        id: group.id,
        label: group.label || group.name || "Matrix group",
        verticalItems: group.verticalItems?.map(item => ({
          id: item.id,
          text: item.text,
          label: item.label || item.text
        })) || [],
        horizontalItems: group.horizontalItems?.map(item => ({
          id: item.id,
          text: item.text,
          label: item.label || item.text
        })) || []
      }));
    case 'text':
      return (data.textAreas || []).map(area => ({
        id: area.id,
        label: area.label || "Text input"
      }));
    default:
      return [];
  }
}

// Helper to format a single response
function formatResponseData(response, questionMap) {
  return {
    id: response._id.toString(),
    participantId: response.participantId,
    visitorId: response.visitorId,
    startTime: response.startTime,
    endTime: response.endTime,
    duration: new Date(response.endTime) - new Date(response.startTime),
    answers: response.responses.map(resp => {
      const questionId = resp.questionId.toString();
      const questionInfo = questionMap[questionId] || { title: "Unknown Question" };
      
      return {
        questionId: questionId,
        questionTitle: questionInfo.title,
        questionLabel: questionInfo.label || questionInfo.title,
        answer: resp.response,
        timestamp: resp.timestamp
      };
    }),
    createdAt: response.createdAt
  };
}

// Group responses by participant
function groupResponsesByParticipant(responses, questionMap) {
  const byParticipant = {};
  
  responses.forEach(response => {
    if (!byParticipant[response.participantId]) {
      byParticipant[response.participantId] = [];
    }
    byParticipant[response.participantId].push(formatResponseData(response, questionMap));
  });
  
  return byParticipant;
}

// Group responses by question
function groupResponsesByQuestion(responses, questions) {
  const byQuestion = {};
  
  // Initialize with empty arrays for each question
  questions.forEach(question => {
    const questionId = question._id.toString();
    const questionTitle = question.data?.title || question.data?.prompt || "Untitled Question";
    
    byQuestion[questionId] = {
      questionId: questionId,
      label: questionTitle,
      title: questionTitle,
      type: question.type,
      artifacts: (question.data?.artifacts || []).map(artifact => ({
        id: artifact.id,
        label: artifact.label || artifact.title || artifact.name || "Unnamed artifact",
        name: artifact.name,
        contentType: artifact.contentType
      })),
      answers: []
    };
  });
  
  // Add all answers to their respective questions
  responses.forEach(response => {
    response.responses.forEach(resp => {
      const questionId = resp.questionId.toString();
      if (byQuestion[questionId]) {
        byQuestion[questionId].answers.push({
          participantId: response.participantId,
          answer: resp.response,
          timestamp: resp.timestamp
        });
      }
    });
  });
  
  return byQuestion;
}

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
