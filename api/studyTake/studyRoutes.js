import express from 'express';
import mongoose from 'mongoose';
import Study from '../../models/study.js';
const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const studyId = req.params.id;
    
    const study = await Study.findById(studyId)
      .populate({
        path: "questions",
        select: "questionText options type required"
      })
      .select("title description questions createdAt status");
    
    if (!study) {
      return res.status(404).json({ message: "This study does not exist" });
    }

    // This check might be causing the issue
    if (study.status !== 'active') {
      return res.status(403).json({ message: "This study is not currently available" });
    }
    
    res.json(study);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: "Unable to load study" });
  }
});

export default router;