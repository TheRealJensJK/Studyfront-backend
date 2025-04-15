import mongoose, { Schema } from 'mongoose';

const questionSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  id: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  file: { type: Schema.Types.Mixed }
});

const studySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    questions: [questionSchema], 
    files: [
      {
        //Array of file metadata
        filename: String,
        path: String,
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Study || mongoose.model('Study', studySchema);