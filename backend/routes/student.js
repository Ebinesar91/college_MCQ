const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailableTests, startExam, submitExam,
  getMyResults, getResultDetail,
} = require('../controllers/studentController');

router.use(protect, authorize('student'));

router.get('/tests', getAvailableTests);
router.get('/tests/:id/start', startExam);
router.post('/tests/:id/submit', submitExam);
router.get('/results', getMyResults);
router.get('/results/:testId', getResultDetail);

module.exports = router;
