import express from 'express';
import dbConnect from '../../lib/dbconnect.js';
import Result from '../../models/results.js';

const router = express.Router();

// POST /api/responses/submit - Submit study responses
router.post('/submit', async (req, res) => {
  try {
    await dbConnect();
    const { studyId, participantId, startTime, endTime, responses } = req.body;

    // Validate required fields
    if (!studyId || !participantId || !responses) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create new result document
    const result = new Result({
      studyId,
      participantId,
      startTime,
      endTime,
      answers: responses.map(({ questionId, response, timestamp }) => ({
        questionId,
        answer: response,
        timestamp
      }))
    });

    await result.save();
    
    res.status(201).json({
      message: 'Responses submitted successfully',
      resultId: result._id
    });

  } catch (error) {
    console.error('Error submitting responses:', error);
    res.status(500).json({ message: 'Failed to submit responses' });
  }
});

export default router;