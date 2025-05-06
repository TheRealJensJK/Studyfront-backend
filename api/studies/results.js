import express from 'express';
import { ObjectId } from 'mongodb';
import dbConnect from '../../lib/dbconnect.js';
import Result from '../../models/results.js';

const router = express.Router();

// POST /results - Submit answers for a study
router.post('/', async (req, res) => {
  try {
    await dbConnect();
    const { studyId, userId, answers } = req.body;

    if (!ObjectId.isValid(studyId)) {
      return res.status(400).json({ error: 'Invalid study ID' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array' });
    }

    const result = new Result({
      studyId,
      userId,
      answers,
    });

    await result.save();
    res.status(201).json({ message: 'Result submitted successfully', result });
  } catch (error) {
    console.error('Error submitting result:', error);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

// GET /results/:id - Get all results for a specific study
router.get('/:id', async (req, res) => {
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