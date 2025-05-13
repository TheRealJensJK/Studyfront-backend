import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Study",
    required: true
  },
  participantId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Check if model already exists to prevent recompilation error
const Response = mongoose.models.Response || mongoose.model('Response', responseSchema);

export default Response;