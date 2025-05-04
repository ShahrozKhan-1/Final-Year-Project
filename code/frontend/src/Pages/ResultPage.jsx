import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserRole } from '../auth';
import { motion, AnimatePresence } from 'framer-motion';
import './ResultPage.css'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-white rounded-xl shadow-lg"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-700">Verifying access...</p>
      </motion.div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center p-8 bg-white rounded-xl shadow-lg"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-4xl mb-4"
        >
          📊
        </motion.div>
        <p className="text-lg font-medium text-gray-700">Analyzing your results...</p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-500 mt-2"
        >
          Preparing detailed insights
        </motion.p>
      </motion.div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md"
      >
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Results</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/student-dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  if (!results) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-8 bg-white rounded-xl shadow-lg"
      >
        <div className="text-gray-500 text-5xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Available</h3>
        <p className="text-gray-600 mb-4">We couldn't find any results for this attempt.</p>
        <button
          onClick={() => navigate('/student-dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Test Results
            </span>
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100px' }}
            transition={{ delay: 0.4 }}
            className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"
          ></motion.div>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Your Performance</h3>
                <p className="text-gray-500">Detailed analysis of your test</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mt-4 sm:mt-0"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg blur opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow">
                    <span className="text-xl font-bold">{results.score.toFixed(1)}%</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </motion.div>

        {/* Questions Section */}
        {results.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Question Analysis</h3>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {results.questions.length} questions
              </span>
            </div>

            <div className="space-y-6">
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
            className="bg-white rounded-2xl shadow-xl p-6 mb-10"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <span className="text-red-500 text-xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Areas for Improvement</h3>
            </div>
            <p className="text-gray-600 mb-4">Focus on these topics to improve your performance:</p>
            <div className="flex flex-wrap gap-3">
              {results.weakTopics.map((topic, index) => (
                <motion.span
                  key={index}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-full font-medium"
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
            className="bg-white rounded-2xl shadow-xl p-6 mb-10 border-l-4 border-blue-500"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <span className="text-blue-500 text-xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Detailed Feedback</h3>
            </div>
            <div className="prose max-w-none text-gray-700">
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
          className="text-center"
        >
          <motion.button
            onClick={() => navigate('/student-dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
    green: 'from-green-100 to-green-50 text-green-800',
    yellow: 'from-yellow-100 to-yellow-50 text-yellow-800',
    blue: 'from-blue-100 to-blue-50 text-blue-800'
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 shadow-sm`}
    >
      <div className="flex items-center">
        <div className="p-2 bg-white rounded-full mr-3 shadow-sm">
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Question Result Component
const QuestionResult = ({ question, index }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${question.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="flex items-center mb-3 sm:mb-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${question.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {question.isCorrect ? '✓' : '✗'}
            </div>
            <h4 className="text-lg font-bold text-gray-900">Question {index + 1}</h4>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {question.topic}
          </span>
        </div>

        <p className="text-gray-700 mb-4">{question.content}</p>
        <p className="text-sm text-gray-500 mb-4"><strong>Type:</strong> {question.questionType}</p>

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

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Feedback</p>
          <p className="text-gray-700">{question.feedback}</p>
        </div>
      </div>
    </div>
  );
};

// MCQ Result Component
const MCQResult = ({ options, correctOption, studentAnswer }) => (
  <div className="mb-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      {['A', 'B', 'C', 'D'].map(opt => (
        <motion.div
          key={opt}
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg border ${correctOption === opt ? 'bg-green-50 border-green-300' : studentAnswer === opt ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}
        >
          <div className="flex items-center">
            <span className={`font-bold mr-2 ${correctOption === opt ? 'text-green-600' : studentAnswer === opt ? 'text-yellow-600' : 'text-gray-500'}`}>
              {opt})
            </span>
            <span>{options[opt]}</span>
          </div>
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="font-medium text-blue-700">Your Answer</p>
        <p>{studentAnswer}</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="font-medium text-green-700">Correct Answer</p>
        <p>{correctOption}</p>
      </div>
    </div>
  </div>
);

// QNA Result Component
const QNAResult = ({ studentAnswer, modelAnswer }) => (
  <div className="space-y-3 mb-4">
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <p className="font-medium text-yellow-700 mb-1">Your Answer</p>
      <p className="text-gray-800">{studentAnswer}</p>
    </div>
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <p className="font-medium text-green-700 mb-1">Model Answer</p>
      <p className="text-gray-800">{modelAnswer}</p>
    </div>
  </div>
);

export default ResultPage;


