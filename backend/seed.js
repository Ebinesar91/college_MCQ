/**
 * Seed Script — creates the default admin account
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('✅ Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@exam.com',
    password: 'Admin@123',
    role: 'admin',
  });

  console.log('✅ Admin created successfully!');
  console.log('   Email   :', admin.email);
  console.log('   Password: Admin@123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
