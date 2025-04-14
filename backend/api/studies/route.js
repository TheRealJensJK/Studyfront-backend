import express from "express";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";

const router = express.Router();

// POST /api/studies - Create a new study
router.post("/", async (req, res) => {
  try {
    await dbConnect();
    const { title, description } = req.body;

    const newStudy = new Study({ title, description });
    const savedStudy = await newStudy.save();

    res.status(201).json(savedStudy);
  } catch (error) {
    console.error("Error creating study:", error);
    res.status(500).json({ error: "Failed to create study" });
  }
});

// GET /api/studies - Fetch all studies
router.get("/", async (req, res) => {
  try {
    await dbConnect();
    const studies = await Study.find({});
    res.status(200).json(studies);
  } catch (error) {
    console.error("Error fetching studies:", error);
    res.status(500).json({ error: "Failed to fetch studies" });
  }
});

export default router;