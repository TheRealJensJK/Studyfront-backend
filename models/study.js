import mongoose, { Schema } from 'mongoose';
import File from './file.js';

const questionSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  id: { type: String },
  title: { type: String },
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  file: [File.schema],
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
    hasTermsAndConditions: { type: Boolean, default: false },
    termsAndConditions: { type: String },
    hasDemographics: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
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
    endDate: { type: Date },
    timedStudy: { type: Boolean, default: false },
    startedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Study || mongoose.model('Study', studySchema);