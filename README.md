# 🎓 Secure MCQ Exam System — MERN Stack

A full-stack, department & year-based **Secure Online MCQ Examination System** with role-based access control, JWT authentication, and an anti-cheating secure exam mode.

---

## 🛠 Tech Stack

| Layer     | Technology             |
|-----------|------------------------|
| Frontend  | React 18 + Vite        |
| Backend   | Node.js + Express.js   |
| Database  | MongoDB (Mongoose)     |
| Auth      | JWT + bcrypt           |
| HTTP      | Axios                  |
| Routing   | React Router v6        |
| Toasts    | react-hot-toast        |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Start Backend

```bash
cd backend
npm install
node seed.js          # Create admin account
npm run dev           # Starts on http://localhost:5000
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:5173
```

---

## 🔑 Default Credentials

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@exam.com    | Admin@123  |

> Teachers are created by the admin. Students self-register.

---

## 📁 Project Structure

```
mcq-exam-system/
├── backend/
│   ├── config/        db.js
│   ├── controllers/   authController, adminController, teacherController, studentController
│   ├── middleware/    auth.js (JWT + RBAC)
│   ├── models/        User, Test, Question, Result
│   ├── routes/        auth, admin, teacher, student
│   ├── server.js
│   └── seed.js
│
└── frontend/
    └── src/
        ├── context/   AuthContext.jsx
        ├── components/ ProtectedRoute.jsx
        ├── pages/     Login, Register, AdminDashboard, TeacherDashboard,
        │              StudentDashboard, ExamPage, ResultPage
        └── services/  api.js
```

---

## 🔒 Secure Exam Mode Features

| Feature | Description |
|---------|-------------|
| **Fullscreen** | Exam auto-enters fullscreen; exits are warned |
| **Tab Detection** | `visibilitychange` API detects tab switching |
| **3-Strike Rule** | 3 tab switches triggers auto-submission |
| **Auto-Submit** | Timer expiry automatically submits the exam |
| **Activity Log** | `tabSwitches` and `autoSubmitted` saved per result |

---

## 🌐 API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/register` | POST | Student registration |
| `/api/auth/login` | POST | Login (all roles) |
| `/api/auth/me` | GET | Get current user |
| `/api/admin/teachers` | GET/POST | List/create teachers |
| `/api/admin/teachers/:id/toggle` | PATCH | Enable/disable teacher |
| `/api/admin/teachers/:id` | DELETE | Remove teacher |
| `/api/teacher/tests` | GET/POST | Teacher's tests |
| `/api/teacher/tests/:id/questions` | POST | Add questions |
| `/api/teacher/results` | GET | View results (filtered) |
| `/api/student/tests` | GET | Available exams |
| `/api/student/tests/:id/start` | GET | Get questions (no answers) |
| `/api/student/tests/:id/submit` | POST | Submit & auto-score |
| `/api/student/results` | GET | Own results |
