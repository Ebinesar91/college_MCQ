const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');

// @desc    Get available tests for student
// @route   GET /api/student/tests
// @access  Student
const getAvailableTests = async (req, res) => {
  try {
    const now = new Date();
    const tests = await Test.find({
      department: req.user.department,
      year: req.user.year,
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true,
    }).populate('teacher', 'name department');

    // Filter out tests already submitted
    const submittedResults = await Result.find({
      student: req.user._id,
      test: { $in: tests.map((t) => t._id) },
    }).select('test');

    const submittedTestIds = new Set(submittedResults.map((r) => r.test.toString()));

    const availableTests = tests.map((test) => ({
      ...test.toObject(),
      isSubmitted: submittedTestIds.has(test._id.toString()),
    }));

    res.json({ success: true, tests: availableTests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get test questions (for exam)
// @route   GET /api/student/tests/:id/start
// @access  Student
const startExam = async (req, res) => {
  try {
    const now = new Date();
    const test = await Test.findOne({
      _id: req.params.id,
      department: req.user.department,
      year: req.user.year,
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true,
    });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not available' });
    }

    // Check if already submitted
    const existing = await Result.findOne({ student: req.user._id, test: test._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
    }

    let questions = await Question.find({ testId: test._id }).select('-correctAnswer');

    // Randomize if enabled
    if (test.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Calculate remaining time
    const endTimestamp = new Date(test.endTime).getTime();
    const maxDurationMs = test.duration * 60 * 1000;
    const timeRemainingMs = Math.min(endTimestamp - now.getTime(), maxDurationMs);

    res.json({
      success: true,
      test: {
        _id: test._id,
        title: test.title,
        duration: test.duration,
        endTime: test.endTime,
        timeRemainingSeconds: Math.floor(timeRemainingMs / 1000),
        negativeMarking: test.negativeMarking,
        negativeMarkValue: test.negativeMarkValue,
      },
      questions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit exam answers
// @route   POST /api/student/tests/:id/submit
// @access  Student
const submitExam = async (req, res) => {
  try {
    const { answers, timeTaken, tabSwitches, autoSubmitted } = req.body;

    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Prevent double submission
    const existing = await Result.findOne({ student: req.user._id, test: test._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    const questions = await Question.find({ testId: test._id });
    const totalMarks = questions.length;

    let score = 0;
    const evaluatedAnswers = questions.map((q) => {
      const studentAnswer = answers.find(
        (a) => a.questionId === q._id.toString()
      );
      const selectedAnswer = studentAnswer ? studentAnswer.selectedAnswer : -1;
      const isCorrect = selectedAnswer === q.correctAnswer;

      if (isCorrect) {
        score += q.marks;
      } else if (test.negativeMarking && selectedAnswer !== -1) {
        score -= test.negativeMarkValue;
      }

      return {
        questionId: q._id,
        selectedAnswer,
        isCorrect,
      };
    });

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    const result = await Result.create({
      student: req.user._id,
      test: test._id,
      score,
      totalMarks,
      answers: evaluatedAnswers,
      timeTaken,
      submittedAt: new Date(),
      suspiciousActivity: {
        tabSwitches: tabSwitches || 0,
        autoSubmitted: autoSubmitted || false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Exam submitted successfully',
      result: {
        score,
        totalMarks,
        percentage: ((score / totalMarks) * 100).toFixed(2),
        submittedAt: result.submittedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's own results
// @route   GET /api/student/results
// @access  Student
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('test', 'title department year duration')
      .sort('-submittedAt');

    const formatted = results.map((r) => ({
      _id: r._id,
      test: r.test,
      score: r.score,
      totalMarks: r.totalMarks,
      percentage: ((r.score / r.totalMarks) * 100).toFixed(2),
      submittedAt: r.submittedAt,
      timeTaken: r.timeTaken,
    }));

    res.json({ success: true, results: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed result for a specific test
// @route   GET /api/student/results/:testId
// @access  Student
const getResultDetail = async (req, res) => {
  try {
    const result = await Result.findOne({
      student: req.user._id,
      test: req.params.testId,
    })
      .populate('test', 'title department year negativeMarking')
      .populate('answers.questionId', 'question options correctAnswer');

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAvailableTests, startExam, submitExam, getMyResults, getResultDetail };
