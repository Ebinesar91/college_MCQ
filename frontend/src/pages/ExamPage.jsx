import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock, ChevronLeft, ChevronRight, CheckCircle, Maximize } from 'lucide-react';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);
  const submitRef = useRef(false);

  useEffect(() => {
    loadExam();
    enterFullscreen();
    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const loadExam = async () => {
    try {
      const { data } = await studentAPI.startExam(id);
      setTest(data.test);
      setQuestions(data.questions);
      setTimeLeft(data.test.timeRemainingSeconds);
      setLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load exam');
      navigate('/student');
    }
  };

  useEffect(() => {
    if (!loading && !submitted) {
      document.addEventListener('visibilitychange', handleVisibility);
      document.addEventListener('fullscreenchange', handleFsChange);
      startTimer();
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [loading, submitted]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVisibility = useCallback(() => {
    if (document.hidden && !submitRef.current) {
      setTabSwitches((prev) => {
        const newCount = prev + 1;
        setTabWarnings((w) => {
          const newWarnings = w + 1;
          if (newWarnings >= 3) {
            toast.error('3 tab switches detected! Auto-submitting...');
            setTimeout(() => handleSubmit(true), 1500);
          } else {
            setShowWarning(true);
            toast.error(`⚠️ Warning ${newWarnings}/3: Do not switch tabs!`);
            setTimeout(() => setShowWarning(false), 3000);
          }
          return newWarnings;
        });
        return newCount;
      });
    }
  }, []);

  const handleFsChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
    if (!document.fullscreenElement && !submitRef.current) {
      toast.error('⚠️ Please stay in fullscreen mode!');
    }
  };

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    }
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitRef.current) return;
    submitRef.current = true;
    clearInterval(timerRef.current);
    setSubmitted(true);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answersArray = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] !== undefined ? answers[q._id] : -1,
    }));

    try {
      const { data } = await studentAPI.submitExam(id, {
        answers: answersArray,
        timeTaken,
        tabSwitches,
        autoSubmitted: auto,
      });
      toast.success('Exam submitted successfully!');
      navigate('/result', { state: { result: data.result, testTitle: test?.title } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      navigate('/student');
    }
  }, [answers, questions, tabSwitches, id, startTime, test]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const timePercent = test ? (timeLeft / test.timeRemainingSeconds) * 100 : 100;
  const isLowTime = timeLeft < 300;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading exam...</p>
      </div>
    );
  }

  return (
    <div className="exam-page">
      {showWarning && (
        <div className="tab-warning">
          <AlertTriangle size={24} />
          <span>Tab switch detected! Warning {tabWarnings}/3</span>
        </div>
      )}

      {/* Header */}
      <header className="exam-header">
        <div className="exam-title-section">
          <h2>{test?.title}</h2>
          <span>Q{currentQ + 1} of {questions.length}</span>
        </div>
        <div className="exam-controls">
          {!isFullscreen && (
            <button className="btn btn-ghost btn-sm" onClick={enterFullscreen}>
              <Maximize size={16} /> Fullscreen
            </button>
          )}
          <div className={`timer ${isLowTime ? 'timer-danger' : ''}`}>
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <div className="answered-count">
            <CheckCircle size={16} />
            <span>{answeredCount}/{questions.length} answered</span>
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div className="timer-bar">
        <div
          className="timer-bar-fill"
          style={{
            width: `${timePercent}%`,
            backgroundColor: isLowTime ? '#ef4444' : timePercent < 50 ? '#f59e0b' : '#22c55e',
          }}
        />
      </div>

      <div className="exam-body">
        {/* Question Navigator */}
        <aside className="q-navigator">
          <h4>Questions</h4>
          <div className="q-grid">
            {questions.map((q, i) => (
              <button
                key={q._id}
                className={`q-dot ${i === currentQ ? 'current' : ''} ${answers[q._id] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="q-legend">
            <span className="legend-dot answered"></span> Answered
            <span className="legend-dot current"></span> Current
            <span className="legend-dot"></span> Unanswered
          </div>
          <div className="submit-section">
            <button className="btn btn-primary btn-full" onClick={() => {
              if (confirm(`Submit exam? ${questions.length - answeredCount} question(s) unanswered.`)) {
                handleSubmit(false);
              }
            }}>
              Submit Exam
            </button>
            {tabWarnings > 0 && (
              <p className="warning-text">⚠️ {tabWarnings} tab switch warning(s)</p>
            )}
          </div>
        </aside>

        {/* Question Area */}
        <div className="question-area">
          {questions[currentQ] && (
            <div className="question-card fade-in" key={questions[currentQ]._id}>
              <div className="question-num">Question {currentQ + 1}</div>
              <p className="question-text">{questions[currentQ].question}</p>
              <div className="options-list">
                {questions[currentQ].options.map((opt, i) => (
                  <label
                    key={i}
                    className={`option-label ${answers[questions[currentQ]._id] === i ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`q-${questions[currentQ]._id}`}
                      checked={answers[questions[currentQ]._id] === i}
                      onChange={() => setAnswers({ ...answers, [questions[currentQ]._id]: i })}
                    />
                    <span className="option-letter-circle">{['A', 'B', 'C', 'D'][i]}</span>
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <div className="question-nav-btns">
                <button
                  className="btn btn-ghost"
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(currentQ - 1)}
                >
                  <ChevronLeft size={18} /> Previous
                </button>
                <button
                  className="btn btn-primary"
                  disabled={currentQ === questions.length - 1}
                  onClick={() => setCurrentQ(currentQ + 1)}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
