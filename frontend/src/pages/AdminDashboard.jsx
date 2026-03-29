import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Users, BookOpen, Award, UserPlus, Trash2, ToggleLeft, ToggleRight, LogOut, GraduationCap, Shield } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    if (tab === 'teachers') fetchTeachers();
    if (tab === 'students') fetchStudents();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.stats);
    } catch { }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await adminAPI.getTeachers();
      setTeachers(data.teachers);
    } catch { }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await adminAPI.getStudents();
      setStudents(data.students);
    } catch { }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.createTeacher(form);
      toast.success('Teacher account created!');
      setForm({ name: '', email: '', password: '', department: '' });
      fetchTeachers();
      setTab('teachers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally { setLoading(false); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await adminAPI.toggleTeacher(id);
      toast.success(data.message);
      fetchTeachers();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher permanently?')) return;
    try {
      await adminAPI.deleteTeacher(id);
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Shield size={28} />
          <span>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'overview', label: 'Overview', icon: <BookOpen size={20} /> },
            { id: 'add-teacher', label: 'Add Teacher', icon: <UserPlus size={20} /> },
            { id: 'teachers', label: 'All Teachers', icon: <Users size={20} /> },
            { id: 'students', label: 'All Students', icon: <GraduationCap size={20} /> },
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
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="main-content">
        {tab === 'overview' && (
          <div className="fade-in">
            <h2 className="page-title">Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card stat-blue">
                <Users size={32} />
                <div><h3>{stats.teacherCount ?? 0}</h3><p>Teachers</p></div>
              </div>
              <div className="stat-card stat-green">
                <GraduationCap size={32} />
                <div><h3>{stats.studentCount ?? 0}</h3><p>Students</p></div>
              </div>
              <div className="stat-card stat-purple">
                <BookOpen size={32} />
                <div><h3>{stats.testCount ?? 0}</h3><p>Tests Created</p></div>
              </div>
              <div className="stat-card stat-orange">
                <Award size={32} />
                <div><h3>{stats.resultCount ?? 0}</h3><p>Submissions</p></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'add-teacher' && (
          <div className="fade-in">
            <h2 className="page-title">Create Teacher Account</h2>
            <div className="form-card">
              <form onSubmit={handleCreateTeacher} className="auth-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input placeholder="Dr. Jane Smith" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="teacher@college.edu" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" placeholder="Min 6 characters" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  </div>
                </div>
                <button className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner-sm" /> : <UserPlus size={18} />}
                  {loading ? 'Creating...' : 'Create Teacher'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'teachers' && (
          <div className="fade-in">
            <h2 className="page-title">All Teachers ({teachers.length})</h2>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No teachers yet</td></tr>
                  ) : teachers.map((t) => (
                    <tr key={t._id}>
                      <td><div className="cell-avatar">{t.name.charAt(0)}<span>{t.name}</span></div></td>
                      <td>{t.email}</td>
                      <td><span className="badge badge-dept">{t.department}</span></td>
                      <td><span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>{t.isActive ? 'Active' : 'Disabled'}</span></td>
                      <td className="actions">
                        <button className="icon-btn" onClick={() => handleToggle(t._id)} title="Toggle Status">
                          {t.isActive ? <ToggleRight size={22} color="#22c55e" /> : <ToggleLeft size={22} color="#ef4444" />}
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(t._id)} title="Delete"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div className="fade-in">
            <h2 className="page-title">All Students ({students.length})</h2>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Reg. No</th><th>Email</th><th>Dept</th><th>Year</th></tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No students registered</td></tr>
                  ) : students.map((s) => (
                    <tr key={s._id}>
                      <td><div className="cell-avatar">{s.name.charAt(0)}<span>{s.name}</span></div></td>
                      <td>{s.registerNumber}</td>
                      <td>{s.email}</td>
                      <td><span className="badge badge-dept">{s.department}</span></td>
                      <td>Year {s.year}</td>
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

export default AdminDashboard;
