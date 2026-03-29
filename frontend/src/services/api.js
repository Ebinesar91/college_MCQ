import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Admin
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  createTeacher: (data) => API.post('/admin/teachers', data),
  getTeachers: () => API.get('/admin/teachers'),
  toggleTeacher: (id) => API.patch(`/admin/teachers/${id}/toggle`),
  deleteTeacher: (id) => API.delete(`/admin/teachers/${id}`),
  getStudents: () => API.get('/admin/students'),
};

// Teacher
export const teacherAPI = {
  createTest: (data) => API.post('/teacher/tests', data),
  getTests: (params) => API.get('/teacher/tests', { params }),
  getTest: (id) => API.get(`/teacher/tests/${id}`),
  updateTest: (id, data) => API.put(`/teacher/tests/${id}`, data),
  deleteTest: (id) => API.delete(`/teacher/tests/${id}`),
  addQuestions: (testId, questions) => API.post(`/teacher/tests/${testId}/questions`, { questions }),
  updateQuestion: (qid, data) => API.put(`/teacher/questions/${qid}`, data),
  deleteQuestion: (qid) => API.delete(`/teacher/questions/${qid}`),
  getResults: (params) => API.get('/teacher/results', { params }),
  getLeaderboard: (testId) => API.get(`/teacher/tests/${testId}/leaderboard`),
};

// Student
export const studentAPI = {
  getAvailableTests: () => API.get('/student/tests'),
  startExam: (id) => API.get(`/student/tests/${id}/start`),
  submitExam: (id, data) => API.post(`/student/tests/${id}/submit`, data),
  getMyResults: () => API.get('/student/results'),
  getResultDetail: (testId) => API.get(`/student/results/${testId}`),
};

export default API;
