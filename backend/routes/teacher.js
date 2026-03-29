const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTest, getMyTests, getTest, updateTest, deleteTest,
  addQuestions, updateQuestion, deleteQuestion,
  getResults, getLeaderboard,
} = require('../controllers/teacherController');

router.use(protect, authorize('teacher'));

// Test routes
router.post('/tests', createTest);
router.get('/tests', getMyTests);
router.get('/tests/:id', getTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);
router.get('/tests/:id/leaderboard', getLeaderboard);

// Question routes
router.post('/tests/:id/questions', addQuestions);
router.put('/questions/:qid', updateQuestion);
router.delete('/questions/:qid', deleteQuestion);

// Results
router.get('/results', getResults);

module.exports = router;
