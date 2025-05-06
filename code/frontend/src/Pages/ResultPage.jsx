import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserRole } from '../auth';
import { motion, AnimatePresence } from 'framer-motion';
import './ResultPage.css';

const ResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return navigate('/login');
    if (!roleLoading && role !== 'student') return navigate('/login');
    if (!attemptId) return navigate('/student-dashboard');

    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://127.0.0.1:8000/student/test-result/${attemptId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );

        if (!response.data) throw new Error('No data received');

        const formattedResults = {
          score: response.data.score || 0,
          correctAnswers: response.data.correct_answers || 0,
          totalQuestions: response.data.total_questions || 0,
          marks: {
            obtained: response.data.marks?.obtained || response.data.correct_answers || 0,
            total: response.data.marks?.total || response.data.total_questions || 0
          },
          questions: response.data.questions?.map(q => ({
            ...q,
            content: q.content || 'Question content not available',
            questionType: q.question_type || q.questionType || 'MCQ',
            studentAnswer: q.student_answer || 'No answer provided',
            isCorrect: q.is_correct || false,
            feedback: q.feedback || q.ai_feedback || 'No feedback available',
            modelAnswer: q.model_answer || '',
            correctOption: q.correct_option || 'A',
            options: q.options || {
              A: q.option_a || 'Option A',
              B: q.option_b || 'Option B',
              C: q.option_c || 'Option C',
              D: q.option_d || 'Option D'
            },
            topic: q.topic || 'General'
          })) || [],
          weakTopics: response.data.weak_topics || [],
          feedback: response.data.feedback || response.data.ai_feedback || 'No overall feedback available',
          submittedAt: response.data.submitted_at || response.data.end_time || new Date().toISOString()
        };
        setResults(formattedResults);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to load results');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId, navigate, role, roleLoading]);

  if (roleLoading) return (
    <div className="result-page flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-e0f7fa">Verifying access...</p>
      </motion.div>
    </div>
  );

  if (loading) return (
    <div className="result-page flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-4xl mb-4 text-e0f7fa"
        >
          📊
        </motion.div>
        <p className="text-lg font-medium text-e0f7fa">Analyzing your results...</p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-b0bec5 mt-2"
        >
          Preparing detailed insights
        </motion.p>
      </motion.div>
    </div>
  );

  if (error) return (
    <div className="result-page flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg max-w-md"
      >
        <div className="text-red-300 text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-e0f7fa mb-2">Error Loading Results</h3>
        <p className="text-b0bec5 mb-4">{error}</p>
        <button
          onClick={() => navigate('/student-dashboard')}
          className="px-6 py-2 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  if (!results) return (
    <div className="result-page flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg"
      >
        <div className="text-b0bec5 text-5xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-e0f7fa mb-2">No Results Available</h3>
        <p className="text-b0bec5 mb-4">We couldn't find any results for this attempt.</p>
        <button
          onClick={() => navigate('/student-dashboard')}
          className="px-6 py-2 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="result-page"
    >
      <div className="results-container">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="results-header"
        >
          <h2 className="results-title">Test Results</h2>
          <div className="results-underline"></div>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="score-card"
        >
          <div className="performance-overview">
            <div>
              <h3 className="performance-title">Your Performance</h3>
              <p className="text-b0bec5">Detailed analysis of your test</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
            >
              <div className="performance-score">{results.score.toFixed(1)}%</div>
            </motion.div>
          </div>

          <div className="stats-grid">
            <StatCard 
              icon="✅"
              label="Correct Answers"
              value={`${results.correctAnswers}/${results.totalQuestions}`}
              color="green"
            />
            <StatCard 
              icon="📝"
              label="Marks Obtained"
              value={`${results.marks.obtained}/${results.marks.total}`}
              color="yellow"
            />
            <StatCard 
              icon="🕒"
              label="Submitted At"
              value={new Date(results.submittedAt).toLocaleString()}
              color="blue"
            />
          </div>
        </motion.div>

        {/* Questions Section */}
        {results.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="question-analysis-section"
          >
            <div className="question-analysis-header">
              <h3 className="question-analysis-title">Question Analysis</h3>
              <span className="question-count">{results.questions.length} questions</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {results.questions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <QuestionResult question={question} index={index} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Weak Topics */}
        {results.weakTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="weak-topics-section"
          >
            <div className="weak-topics-header">
              <span className="warning-icon">⚠️</span>
              <h3 className="weak-topics-title">Areas for Improvement</h3>
            </div>
            <p className="text-b0bec5 mb-4">Focus on these topics to improve your performance:</p>
            <div className="weak-topics-list">
              {results.weakTopics.map((topic, index) => (
                <motion.span
                  key={index}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  className="weak-topic-item"
                >
                  {topic}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Feedback */}
        {results.feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="detailed-feedback-section"
          >
            <div className="feedback-header">
              <span className="info-icon">💡</span>
              <h3 className="detailed-feedback-title">Detailed Feedback</h3>
            </div>
            <div className="detailed-feedback-text">
              {results.feedback.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-3">{paragraph}</p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="back-button-container"
        >
          <motion.button
            onClick={() => navigate('/student-dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="back-button"
          >
            <span className="flex items-center justify-center">
              <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`stat-card ${colorClasses[color]}`}
    >
      <div className="flex items-center">
        <div className="stat-icon">{icon}</div>
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Question Result Component
const QuestionResult = ({ question, index }) => {
  return (
    <div className={`question-result-card ${question.isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="question-info">
        <div className="question-header">
          <div className="question-number-badge">
            <div className={`result-icon ${question.isCorrect ? 'correct' : 'incorrect'}`}>
              {question.isCorrect ? '✓' : '✗'}
            </div>
            <span className="question-number">Question {index + 1}</span>
          </div>
          <span className="question-topic">{question.topic}</span>
        </div>

        <p className="question-content">{question.content}</p>
        <p className="text-sm text-b0bec5 mb-4"><strong>Type:</strong> {question.questionType}</p>

        {question.questionType === 'MCQ' ? (
          <MCQResult
            options={question.options}
            correctOption={question.correctOption}
            studentAnswer={question.studentAnswer}
          />
        ) : (
          <QNAResult
            studentAnswer={question.studentAnswer}
            modelAnswer={question.modelAnswer}
          />
        )}

        <div className="feedback-section">
          <p className="feedback-title">Feedback</p>
          <p className="feedback-text">{question.feedback}</p>
        </div>
      </div>
    </div>
  );
};

// MCQ Result Component
const MCQResult = ({ options, correctOption, studentAnswer }) => (
  <div className="answer-section">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      {['A', 'B', 'C', 'D'].map(opt => (
        <motion.div
          key={opt}
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg border ${correctOption === opt ? 'bg-green-500/10 border-green-500/30' : studentAnswer === opt ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-500/5 border-gray-500/10'}`}
        >
          <div className="flex items-center">
            <span className={`font-bold mr-2 ${correctOption === opt ? 'text-green-500' : studentAnswer === opt ? 'text-yellow-500' : 'text-b0bec5'}`}>
              {opt})
            </span>
            <span className="text-e0f7fa">{options[opt]}</span>
          </div>
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div className="student-answer">
        <p className="answer-label">Your Answer</p>
        <p>{studentAnswer}</p>
      </div>
      <div className="correct-answer">
        <p className="answer-label">Correct Answer</p>
        <p>{correctOption}</p>
      </div>
    </div>
  </div>
);

// QNA Result Component
const QNAResult = ({ studentAnswer, modelAnswer }) => (
  <div className="space-y-3 mb-4">
    <div className="student-answer">
      <p className="answer-label">Your Answer</p>
      <p>{studentAnswer}</p>
    </div>
    <div className="correct-answer">
      <p className="answer-label">Model Answer</p>
      <p>{modelAnswer}</p>
    </div>
  </div>
);

export default ResultPage;