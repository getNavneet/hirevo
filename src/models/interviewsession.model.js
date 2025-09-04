import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true, // for fast retrival
  },
  category: {
    type: String,
    enum: ['core', 'programming', 'personal', 'resume'],
    required: true,
  },
  subcategory: {
    type: String,
    default: null,
  },
  level: {
    type: String,
    required: true,
  },
  resume: {
    type: String,
    default: null,
  },
  resumeText: {
    type: String,
    default: null,
  },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null,
//   },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  versionKey: false,
});



const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;