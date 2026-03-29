const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const User = require('../models/User');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/seed', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.json({ success: true, message: 'Admin already exists!', email: existing.email });
    
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@exam.com',
      password: 'Admin@123',
      role: 'admin',
    });
    res.json({ success: true, message: 'Admin created!', email: admin.email, password: 'Admin@123' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
