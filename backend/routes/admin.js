const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTeacher, getAllTeachers, getAllStudents,
  toggleTeacherStatus, deleteTeacher, getStats,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.post('/teachers', createTeacher);
router.get('/teachers', getAllTeachers);
router.patch('/teachers/:id/toggle', toggleTeacherStatus);
router.delete('/teachers/:id', deleteTeacher);
router.get('/students', getAllStudents);

module.exports = router;
