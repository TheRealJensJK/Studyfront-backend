import express from "express";
import multer from "multer";
import dbConnect from "../../lib/dbconnect.js";
import File from "../../models/file.js";

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as a Buffer
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ["jpg", "jpeg", "png", "pdf", "txt"];
    const fileExtension = file.originalname.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

// POST /api/upload - File upload route
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    await dbConnect();

    // Save the file in the database
    const newFile = new File({
      name: file.originalname, // Original file name
      data: file.buffer, // File data as a Buffer
      contentType: file.mimetype, // File MIME type
    });
    await newFile.save();

    res.status(200).json({ message: "File uploaded successfully", fileId: newFile._id });
  } catch (error) {
    console.error("File upload error", error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

// GET /api/upload/:id - Retrieve a file by ID
router.get("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.set("Content-Type", file.contentType);
    res.send(file.data); // Send the file data as a response
  } catch (error) {
    console.error("Error retrieving file", error);
    res.status(500).json({ message: "Error retrieving file" });
  }
});

// DELETE /api/upload/:id - Delete a file by ID
router.delete("/:id", async (req, res) => {
  try {
    await dbConnect();
    const { id } = req.params;

    const deletedFile = await File.findByIdAndDelete(id);

    if (!deletedFile) {
      return res.status(404).json({ message: "File not found" });
    }

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file", error);
    res.status(500).json({ message: "Error deleting file" });
  }
});

export default router;