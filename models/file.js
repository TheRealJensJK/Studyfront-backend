import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Original file name
  data: { type: Buffer, required: true }, // File data as a Buffer
  contentType: { type: String, required: true }, // MIME type of the file
  uploadedAt: { type: Date, default: Date.now }, // Timestamp
});

const File = mongoose.model("File", fileSchema);

export default File;