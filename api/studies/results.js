import express from 'express';
import { ObjectId } from 'mongodb';
import dbConnect from '../../lib/dbconnect.js';
import Result from '../../models/results.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Remove auth check for POST requests
router.post('/', async (req, res) => {
  try {
    await dbConnect();
    const { studyId, participantId, startTime, endTime, responses } = req.body;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: 'Invalid study ID' });
    }

    const result = new Result({
      studyId: new ObjectId(studyId),
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
    res.status(201).json({ message: 'Result submitted successfully', result });
  } catch (error) {
    console.error('Error submitting result:', error);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

// Keep GET route protected
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    await dbConnect();
    const { id: studyId } = req.params;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: 'Invalid study ID' });
    }

    const results = await Result.find({ studyId });

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No results found for this study' });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;