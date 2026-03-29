const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');

// @desc    Create a new test
// @route   POST /api/teacher/tests
// @access  Teacher
const createTest = async (req, res) => {
  try {
    const { title, department, year, duration, startTime, endTime, negativeMarking, negativeMarkValue, randomizeQuestions } = req.body;

    const test = await Test.create({
      title,
      teacher: req.user._id,
      department,
      year,
      duration,
      startTime,
      endTime,
      negativeMarking,
      negativeMarkValue,
      randomizeQuestions,
    });

    res.status(201).json({ success: true, message: 'Test created successfully', test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tests by this teacher
// @route   GET /api/teacher/tests
// @access  Teacher
const getMyTests = async (req, res) => {
  try {
    const { department, year } = req.query;
    const filter = { teacher: req.user._id };
    if (department) filter.department = department;
    if (year) filter.year = parseInt(year);

    const tests = await Test.find(filter).sort('-createdAt');
    
    // Add question count to each test
    const testsWithCount = await Promise.all(
      tests.map(async (test) => {
        const questionCount = await Question.countDocuments({ testId: test._id });
        return { ...test.toObject(), questionCount };
      })
    );

    res.json({ success: true, count: testsWithCount.length, tests: testsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single test
// @route   GET /api/teacher/tests/:id
// @access  Teacher
const getTest = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    const questions = await Question.find({ testId: test._id });
    res.json({ success: true, test, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update test
// @route   PUT /api/teacher/tests/:id
// @access  Teacher
const updateTest = async (req, res) => {
  try {
    const test = await Test.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete test
// @route   DELETE /api/teacher/tests/:id
// @access  Teacher
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    await Question.deleteMany({ testId: test._id });
    await Result.deleteMany({ test: test._id });
    await test.deleteOne();

    res.json({ success: true, message: 'Test and related data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add questions to test
// @route   POST /api/teacher/tests/:id/questions
// @access  Teacher
const addQuestions = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const { questions } = req.body;
    const created = await Question.insertMany(
      questions.map((q) => ({ ...q, testId: test._id }))
    );

    res.status(201).json({ success: true, message: `${created.length} questions added`, questions: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a question
// @route   PUT /api/teacher/questions/:qid
// @access  Teacher
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.qid);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    
    const test = await Test.findOne({ _id: question.testId, teacher: req.user._id });
    if (!test) return res.status(403).json({ success: false, message: 'Not authorized' });

    const updated = await Question.findByIdAndUpdate(req.params.qid, req.body, { new: true });
    res.json({ success: true, question: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/teacher/questions/:qid
// @access  Teacher
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.qid);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    
    const test = await Test.findOne({ _id: question.testId, teacher: req.user._id });
    if (!test) return res.status(403).json({ success: false, message: 'Not authorized' });

    await question.deleteOne();
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get results for teacher's tests
// @route   GET /api/teacher/results
// @access  Teacher
const getResults = async (req, res) => {
  try {
    const { department, year, testId } = req.query;

    // Get teacher's test IDs
    const testFilter = { teacher: req.user._id };
    if (department) testFilter.department = department;
    if (year) testFilter.year = parseInt(year);

    let myTests = await Test.find(testFilter).select('_id title');
    const myTestIds = myTests.map((t) => t._id);

    const resultFilter = { test: { $in: myTestIds } };
    if (testId) resultFilter.test = testId;

    const results = await Result.find(resultFilter)
      .populate('student', 'name registerNumber department year')
      .populate('test', 'title department year')
      .sort('-submittedAt');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard for a test
// @route   GET /api/teacher/tests/:id/leaderboard
// @access  Teacher
const getLeaderboard = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const results = await Result.find({ test: req.params.id })
      .populate('student', 'name registerNumber department year')
      .sort('-score submittedAt');

    res.json({ success: true, test: test.title, leaderboard: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTest, getMyTests, getTest, updateTest, deleteTest,
  addQuestions, updateQuestion, deleteQuestion,
  getResults, getLeaderboard,
};
