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
  visitorId: {
    type: String,
    required: true,
    index: true 
  },
  ipAddress: {
    type: String,
    index: true
  },
  completionToken: {
    type: String,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  demographics: {
    age: String,
    gender: String,
    education: String,
    occupation: String
  },
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    questionText: {
      type: String,
      default: ""
    },
    questionType: {
      type: String,
      default: ""
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