import mongoose, { Schema } from 'mongoose';

const answerSchema = new Schema({
  questionId: { type: String, required: true }, // ID of the question
  answer: { type: Schema.Types.Mixed, required: true }, // User's answer
});

const resultSchema = new Schema(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'Study', required: true }, // Reference to the study
    participantId: { type: String, required: true }, // Participant identifier
    visitorId: { type: String, required: true, index: true }, // Browser fingerprint for preventing duplicates
    startTime: { type: Date },
    endTime: { type: Date },
    answers: [answerSchema], // Array of answers
    submittedAt: { type: Date, default: Date.now }, // Timestamp of submission
  },
  { timestamps: true }
);

export default mongoose.models.Result || mongoose.model('Result', resultSchema);