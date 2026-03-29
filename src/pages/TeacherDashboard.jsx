import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Trash2, Edit3, Users, Trophy,
  LogOut, FileText, Filter, ChevronDown, ChevronUp,
  Clock, Calendar
} from 'lucide-react';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterTest, setFilterTest] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '', department: '', year: '', duration: '',
    startTime: '', endTime: '', negativeMarking: false, negativeMarkValue: 0.25, randomizeQuestions: false,
  });
  const [newQuestion, setNewQuestion] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });
  const [addingQ, setAddingQ] = useState(false);

  useEffect(() => { fetchTests(); }, []);
  useEffect(() => { if (tab === 'results') fetchResults(); }, [tab, filterDept, filterYear, filterTest]);

  const fetchTests = async () => {
    try {
      const { data } = await teacherAPI.getTests();
      setTests(data.tests);
    } catch { }
  };

  const fetchResults = async () => {
    try {
      const { data } = await teacherAPI.getResults({
        department: filterDept, year: filterYear, testId: filterTest,
      });
      setResults(data.results);
    } catch { }
  };

  const openTest = async (test) => {
    setSelectedTest(test);
    try {
      const { data } = await teacherAPI.getTest(test._id);
      setQuestions(data.questions);
    } catch { }
    setTab('questions');
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...testForm, year: parseInt(testForm.year), duration: parseInt(testForm.duration) };
      if (editingTest) {
        await teacherAPI.updateTest(editingTest._id, payload);
        toast.success('Test updated!');
      } else {
        await teacherAPI.createTest(payload);
        toast.success('Test created!');
      }
      setShowForm(false); setEditingTest(null);
      setTestForm({ title: '', department: '', year: '', duration: '', startTime: '', endTime: '', negativeMarking: false, negativeMarkValue: 0.25, randomizeQuestions: false });
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save test');
    }
  };

  const deleteTest = async (id) => {
    if (!confirm('Delete test and all its questions/results?')) return;
    try {
      await teacherAPI.deleteTest(id);
      toast.success('Test deleted');
      fetchTests();
    } catch { toast.error('Failed to delete'); }
  };

  const addQuestion = async () => {
    if (!newQuestion.question || newQuestion.options.some((o) => !o)) {
      toast.error('Fill all question fields'); return;
    }
    setAddingQ(true);
    try {
      await teacherAPI.addQuestions(selectedTest._id, [newQuestion]);
      toast.success('Question added!');
      const { data } = await teacherAPI.getTest(selectedTest._id);
      setQuestions(data.questions);
      setNewQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });
    } catch { toast.error('Failed to add question'); }
    setAddingQ(false);
  };

  const deleteQuestion = async (qid) => {
    try {
      await teacherAPI.deleteQuestion(qid);
      toast.success('Question removed');
      setQuestions((prev) => prev.filter((q) => q._id !== qid));
    } catch { toast.error('Failed to delete'); }
  };

  const fmtDate = (d) => new Date(d).toLocaleString();
  const fmtPct = (score, total) => total > 0 ? ((score / total) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand"><BookOpen size={28} /><span>Teacher</span></div>
        <nav className="sidebar-nav">
          {[
            { id: 'tests', label: 'My Tests', icon: <FileText size={20} /> },
            { id: 'results', label: 'Results', icon: <Users size={20} /> },
          ].map((item) => (
            <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0)}</div>
            <div><p className="user-name">{user?.name}</p><p className="user-role">{user?.department}</p></div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="main-content">
        {tab === 'tests' && (
          <div className="fade-in">
            <div className="page-header">
              <h2 className="page-title">My Tests ({tests.length})</h2>
              <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingTest(null); }}>
                <Plus size={18} /> New Test
              </button>
            </div>

            {showForm && (
              <div className="form-card fade-in">
                <h3>{editingTest ? 'Edit Test' : 'Create New Test'}</h3>
                <form onSubmit={handleTestSubmit} className="auth-form">
                  <div className="form-group">
                    <label>Test Title</label>
                    <input placeholder="e.g. Data Structures Mid Exam" value={testForm.title}
                      onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Department</label>
                      <select value={testForm.department} onChange={(e) => setTestForm({ ...testForm, department: e.target.value })} required>
                        <option value="">Select</option>
                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Year</label>
                      <select value={testForm.year} onChange={(e) => setTestForm({ ...testForm, year: e.target.value })} required>
                        <option value="">Select</option>
                        {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Duration (mins)</label>
                      <input type="number" min="1" placeholder="60" value={testForm.duration}
                        onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time</label>
                      <input type="datetime-local" value={testForm.startTime}
                        onChange={(e) => setTestForm({ ...testForm, startTime: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input type="datetime-local" value={testForm.endTime}
                        onChange={(e) => setTestForm({ ...testForm, endTime: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-row checkbox-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={testForm.negativeMarking}
                        onChange={(e) => setTestForm({ ...testForm, negativeMarking: e.target.checked })} />
                      Negative Marking ({testForm.negativeMarkValue} per wrong)
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={testForm.randomizeQuestions}
                        onChange={(e) => setTestForm({ ...testForm, randomizeQuestions: e.target.checked })} />
                      Randomize Questions
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{editingTest ? 'Update' : 'Create'} Test</button>
                  </div>
                </form>
              </div>
            )}

            <div className="tests-grid">
              {tests.length === 0 ? (
                <div className="empty-card">
                  <BookOpen size={48} />
                  <p>No tests yet. Create your first test!</p>
                </div>
              ) : tests.map((t) => (
                <div key={t._id} className="test-card">
                  <div className="test-card-header">
                    <h3>{t.title}</h3>
                    <div className="test-badges">
                      <span className="badge badge-dept">{t.department}</span>
                      <span className="badge badge-year">Year {t.year}</span>
                    </div>
                  </div>
                  <div className="test-meta">
                    <span><Clock size={14} /> {t.duration} mins</span>
                    <span><Calendar size={14} /> {fmtDate(t.startTime)}</span>
                    <span><FileText size={14} /> {t.questionCount} questions</span>
                  </div>
                  <div className="test-card-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openTest(t)}>
                      <Edit3 size={15} /> Manage Questions
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteTest(t._id)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'questions' && selectedTest && (
          <div className="fade-in">
            <div className="page-header">
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('tests')}>← Back to Tests</button>
                <h2 className="page-title">{selectedTest.title} — Questions ({questions.length})</h2>
              </div>
            </div>
            <div className="form-card fade-in">
              <h3>Add New Question</h3>
              <div className="form-group">
                <label>Question</label>
                <textarea rows={2} placeholder="Enter your question..." value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} />
              </div>
              <div className="options-grid">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={i} className="option-input">
                    <span className="option-letter">{letter}</span>
                    <input placeholder={`Option ${letter}`} value={newQuestion.options[i]}
                      onChange={(e) => {
                        const opts = [...newQuestion.options];
                        opts[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts });
                      }} />
                  </div>
                ))}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select value={newQuestion.correctAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: parseInt(e.target.value) })}>
                    {['A', 'B', 'C', 'D'].map((l, i) => <option key={i} value={i}>Option {l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marks</label>
                  <input type="number" min="1" value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={addQuestion} disabled={addingQ}>
                <Plus size={18} /> Add Question
              </button>
            </div>

            <div className="questions-list">
              {questions.map((q, idx) => (
                <div key={q._id} className="question-item">
                  <div className="question-header">
                    <span className="q-num">Q{idx + 1}</span>
                    <p>{q.question}</p>
                    <button className="icon-btn danger" onClick={() => deleteQuestion(q._id)}><Trash2 size={16} /></button>
                  </div>
                  <div className="options-display">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`option-chip ${i === q.correctAnswer ? 'correct' : ''}`}>
                        {['A', 'B', 'C', 'D'][i]}. {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'results' && (
          <div className="fade-in">
            <h2 className="page-title">Student Results</h2>
            <div className="filter-bar">
              <Filter size={18} />
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <select value={filterTest} onChange={(e) => setFilterTest(e.target.value)}>
                <option value="">All Tests</option>
                {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Reg. No</th><th>Test</th><th>Score</th><th>%</th><th>Submitted</th><th>Tab Switches</th></tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr><td colSpan={7} className="empty-state">No results found</td></tr>
                  ) : results.map((r) => (
                    <tr key={r._id}>
                      <td>{r.student?.name}</td>
                      <td>{r.student?.registerNumber}</td>
                      <td>{r.test?.title}</td>
                      <td>{r.score}/{r.totalMarks}</td>
                      <td>
                        <span className={`badge ${parseFloat(fmtPct(r.score, r.totalMarks)) >= 50 ? 'badge-success' : 'badge-danger'}`}>
                          {fmtPct(r.score, r.totalMarks)}
                        </span>
                      </td>
                      <td>{fmtDate(r.submittedAt)}</td>
                      <td>
                        <span className={`badge ${r.suspiciousActivity?.tabSwitches > 0 ? 'badge-warning' : 'badge-success'}`}>
                          {r.suspiciousActivity?.tabSwitches ?? 0}
                          {r.suspiciousActivity?.autoSubmitted && ' ⚠ Auto'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
