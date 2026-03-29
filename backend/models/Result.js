const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedAnswer: {
          type: Number,
          default: -1, // -1 means unanswered
        },
        isCorrect: Boolean,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    timeTaken: {
      type: Number, // in seconds
    },
    suspiciousActivity: {
      tabSwitches: {
        type: Number,
        default: 0,
      },
      autoSubmitted: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Ensure one result per student per test
resultSchema.index({ student: 1, test: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
