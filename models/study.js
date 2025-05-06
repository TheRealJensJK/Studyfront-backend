import mongoose, { Schema } from 'mongoose';
import File from './file';

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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    questions: [questionSchema], 
    files: [File.schema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Study || mongoose.model('Study', studySchema);