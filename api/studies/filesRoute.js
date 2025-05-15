import express from "express";
import multer from "multer";
import File from "../../models/file.js";
import dbConnect from "../../lib/dbconnect.js";

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const multerUpload = multer({
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/apng', 'image/avif', 'image/gifs', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mp4', 'audio/mp3', 'audio/m4a', 'audio/mpeg', 'audio/ogg', 'audio/ogv', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }
});

const upload = (req, res, next) => {
  multerUpload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            code: 'FILE_TOO_LARGE'
          });
        }
        return res.status(400).json({ error: err.message, code: err.code });
      } else {
        return res.status(415).json({ 
          error: err.message,
          code: 'UNSUPPORTED_FILE_TYPE'
        });
      }
    }
    next();
  });
};

// POST /api/studies/:studyId/files - Upload files for a study
router.post("/:studyId/files", upload, async (req, res) => {
  try {
    await dbConnect();
    const { studyId } = req.params;

    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded", 
        code: 'NO_FILE_UPLOADED' 
      });
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
    
    if (error.message && error.message.includes('document size')) {
      return res.status(413).json({ 
        error: "File too large for database storage. Please use a smaller file.", 
        code: 'DATABASE_SIZE_LIMIT' 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to upload file",
      code: 'SERVER_ERROR'
    });
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