import express from "express";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// POST /api/studies - Create a new study
router.post("/", authMiddleware, async (req, res) => {
  try {
    await dbConnect();
    const { title, description } = req.body;
    
    // Get userId from authenticated request
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const newStudy = new Study({ 
      title, 
      description,
      userId
    });

    const savedStudy = await newStudy.save();
    
    if (!savedStudy) {
      return res.status(500).json({ error: "Failed to save study" });
    }

    res.status(201).json(savedStudy);
  } catch (error) {
    console.error("Error creating study:", error);
    res.status(500).json({ 
      error: "Failed to create study", 
      details: error.message 
    });
  }
});

// GET /api/studies - Fetch all studies for the authenticated user
router.get("/", async (req, res) => {
  try {
    await dbConnect();
    const userId = req.user._id;
    const studies = await Study.find({ userId });
    res.status(200).json(studies);
  } catch (error) {
    console.error("Error fetching studies:", error);
    res.status(500).json({ error: "Failed to fetch studies" });
  }
});

// GET /api/studies/:id - Get a specific study
router.get("/:id", async (req, res) => {
  try {
    await dbConnect();
    const study = await Study.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!study) {
      return res.status(404).json({ error: "Study not found or unauthorized" });
    }
    
    res.status(200).json(study);
  } catch (error) {
    console.error("Error fetching study:", error);
    res.status(500).json({ error: "Failed to fetch study" });
  }
});

export default router;