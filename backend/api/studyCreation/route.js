import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const router = express.Router();

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

// POST /api/studyCreation - Create a new study
router.post("/", async (req, res) => {
  const { title, description } = req.body;

  // Validate input
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const newStudy = {
    title,
    description,
    createdAt: new Date().toISOString(),
  };

  try {
    await client.connect();
    const database = client.db("studyfront");
    const studies = database.collection("studies");
    const result = await studies.insertOne(newStudy);

    res.status(201).json({
      id: result.insertedId,
      title: newStudy.title,
      description: newStudy.description,
      createdAt: newStudy.createdAt,
    });
  } catch (error) {
    console.error("Failed connecting to database: ", error);
    res.status(500).json({ error: "Failed to create a study due to a database error" });
  } finally {
    await client.close();
  }
});

export default router;