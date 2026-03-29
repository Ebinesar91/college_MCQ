import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Clock, Calendar, Play, Award, LogOut, GraduationCap, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchTests(); }, []);
  useEffect(() => { if (tab === 'results') fetchResults(); }, [tab]);

  const fetchTests = async () => {
    try {
      const { data } = await studentAPI.getAvailableTests();
      setTests(data.tests);
    } catch { }
  };

  const fetchResults = async () => {
    try {
      const { data } = await studentAPI.getMyResults();
      setResults(data.results);
    } catch { }
  };

  const startExam = (testId) => navigate(`/exam/${testId}`);
  const fmtDate = (d) => new Date(d).toLocaleString();
  const fmtPct = (s, t) => t > 0 ? ((s / t) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand"><GraduationCap size={28} /><span>Student</span></div>
        <nav className="sidebar-nav">
          {[
            { id: 'tests', label: 'Available Tests', icon: <BookOpen size={20} /> },
            { id: 'results', label: 'My Results', icon: <Award size={20} /> },
          ].map((item) => (
            <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0)}</div>
            <div>
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.registerNumber} • {user?.department} Y{user?.year}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="main-content">
        {tab === 'tests' && (
          <div className="fade-in">
            <h2 className="page-title">Available Exams</h2>
            <p className="page-subtitle">
              Showing exams for <strong>{user?.department}</strong> — Year <strong>{user?.year}</strong>
            </p>
            <div className="tests-grid">
              {tests.length === 0 ? (
                <div className="empty-card">
                  <BookOpen size={48} />
                  <p>No active exams available right now.</p>
                </div>
              ) : tests.map((t) => (
                <div key={t._id} className={`test-card ${t.isSubmitted ? 'submitted' : ''}`}>
                  <div className="test-card-header">
                    <h3>{t.title}</h3>
                    <div className="test-badges">
                      <span className="badge badge-dept">{t.department}</span>
                      <span className="badge badge-year">Year {t.year}</span>
                    </div>
                  </div>
                  <div className="test-meta">
                    <span><Clock size={14} /> {t.duration} mins</span>
                    <span><Calendar size={14} /> Ends: {fmtDate(t.endTime)}</span>
                    <span>By: {t.teacher?.name}</span>
                  </div>
                  <div className="test-card-actions">
                    {t.isSubmitted ? (
                      <div className="submitted-badge">
                        <CheckCircle size={18} /> Already Submitted
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={() => startExam(t._id)}>
                        <Play size={18} /> Start Exam
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'results' && (
          <div className="fade-in">
            <h2 className="page-title">My Results</h2>
            {results.length === 0 ? (
              <div className="empty-card">
                <Award size={48} />
                <p>No results yet. Complete an exam first!</p>
              </div>
            ) : (
              <div className="results-grid">
                {results.map((r) => {
                  const pct = parseFloat(fmtPct(r.score, r.totalMarks));
                  return (
                    <div key={r._id} className="result-card">
                      <div className="result-header">
                        <h3>{r.test?.title}</h3>
                        <span className={`grade-badge ${pct >= 75 ? 'grade-a' : pct >= 50 ? 'grade-b' : 'grade-c'}`}>
                          {pct >= 75 ? 'A' : pct >= 50 ? 'B' : 'C'}
                        </span>
                      </div>
                      <div className="score-circle">
                        <div className="score-num">{r.score}<span>/{r.totalMarks}</span></div>
                        <p className="score-pct">{fmtPct(r.score, r.totalMarks)}</p>
                      </div>
                      <div className="result-meta">
                        <span><Calendar size={13} /> {fmtDate(r.submittedAt)}</span>
                        <span><Clock size={13} /> {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
