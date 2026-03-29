const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Create teacher account
// @route   POST /api/admin/teachers
// @access  Admin
const createTeacher = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const teacher = await User.create({
      name,
      email,
      password,
      role: 'teacher',
      department,
    });

    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully',
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        isActive: teacher.isActive,
        createdAt: teacher.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Admin
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort('-createdAt');
    res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Admin
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort('-createdAt');
    res.json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle teacher active status
// @route   PATCH /api/admin/teachers/:id/toggle
// @access  Admin
const toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    res.json({
      success: true,
      message: `Teacher ${teacher.isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: teacher.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Admin
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await teacher.deleteOne();
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const [teacherCount, studentCount] = await Promise.all([
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
    ]);
    const Test = require('../models/Test');
    const Result = require('../models/Result');
    const [testCount, resultCount] = await Promise.all([
      Test.countDocuments(),
      Result.countDocuments(),
    ]);
    res.json({ success: true, stats: { teacherCount, studentCount, testCount, resultCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTeacher, getAllTeachers, getAllStudents, toggleTeacherStatus, deleteTeacher, getStats };
