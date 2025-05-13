// filepath: c:\Users\madel\web-project-group-5\Studyfront-backend\api\studies\filesRoute.js
import express from "express";
import multer from "multer";
import File from "../../models/file.js";
import dbConnect from "../../lib/dbconnect.js";

const router = express.Router();
const upload = multer(); // Use multer for handling file uploads

// POST /api/studies/:studyId/files - Upload files for a study
router.post("/:studyId/files", upload.single("file"), async (req, res) => {
  try {
    await dbConnect();
    const { studyId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = new File({
      name: req.file.originalname,
      displayName: req.body.displayName || req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      studyId,
    });

    await file.save();
    res.status(201).json({ message: "File uploaded successfully", file });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// GET /api/studies/:studyId/files - Get all files for a study
router.get("/:studyId/files", async (req, res) => {
  try {
    await dbConnect();
    const { studyId } = req.params;

    const files = await File.find({ studyId }).select("-data"); // Exclude file data
    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

export default router;