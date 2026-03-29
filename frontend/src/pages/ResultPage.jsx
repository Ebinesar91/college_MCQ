import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, Trophy } from 'lucide-react';

const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    navigate('/student');
    return null;
  }

  const { score, totalMarks, percentage, submittedAt } = result;
  const pct = parseFloat(percentage);
  const passed = pct >= 50;

  return (
    <div className="result-page">
      <div className="result-container">
        <div className={`result-icon-wrap ${passed ? 'pass' : 'fail'}`}>
          {passed ? <Trophy size={64} /> : <XCircle size={64} />}
        </div>
        <h1 className="result-title">{passed ? 'Congratulations! 🎉' : 'Better Luck Next Time'}</h1>
        <h2 className="test-name">{state?.testTitle}</h2>

        <div className="score-display">
          <div className="big-score">
            <span className="score-value">{score}</span>
            <span className="score-divider">/</span>
            <span className="score-total">{totalMarks}</span>
          </div>
          <div className="percentage-ring">
            <svg viewBox="0 0 120 120" className="ring-svg">
              <circle cx="60" cy="60" r="50" className="ring-bg" />
              <circle
                cx="60" cy="60" r="50"
                className="ring-fill"
                style={{
                  stroke: pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444',
                  strokeDasharray: `${(pct / 100) * 314} 314`,
                }}
              />
            </svg>
            <div className="ring-text">
              <span>{percentage}%</span>
              <small>{pct >= 75 ? 'Excellent' : pct >= 50 ? 'Pass' : 'Fail'}</small>
            </div>
          </div>
        </div>

        <div className="result-info-row">
          <div className="info-item">
            <CheckCircle size={20} />
            <div><p>Submitted At</p><strong>{new Date(submittedAt).toLocaleString()}</strong></div>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn btn-primary" onClick={() => navigate('/student')}>
            <Home size={18} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
