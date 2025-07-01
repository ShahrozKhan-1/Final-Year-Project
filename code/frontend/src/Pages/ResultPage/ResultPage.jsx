import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useUserRole } from "../../auth"
import { motion, AnimatePresence } from "framer-motion"
import "./result-page-styles.css"
// import "../../global.css"


const ResultPage = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { role, loading: roleLoading } = useUserRole()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return navigate("/login")
    if (!roleLoading && role !== "student") return navigate("/login")
    if (!attemptId) return navigate("/student-dashboard")

    const fetchResults = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`http://127.0.0.1:8000/student/test-result/${attemptId}/`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })

        if (!response.data) throw new Error("No data received")

        const formattedResults = {
          score: response.data.score || 0,
          correctAnswers: response.data.correct_answers || 0,
          totalQuestions: response.data.total_questions || 0,
          marks: {
            obtained: response.data.marks?.obtained || response.data.correct_answers || 0,
            total: response.data.marks?.total || response.data.total_questions || 0,
          },
          questions:
            response.data.questions?.map((q) => ({
              ...q,
              content: q.content || "Question content not available",
              questionType: q.question_type || q.questionType || "MCQ",
              studentAnswer: q.student_answer || "No answer provided",
              isCorrect: q.is_correct || false,
              feedback: q.feedback || q.ai_feedback || "No feedback available",
              modelAnswer: q.model_answer || "",
              correctOption: q.correct_option || "A",
              options: q.options || {
                A: q.option_a || "Option A",
                B: q.option_b || "Option B",
                C: q.option_c || "Option C",
                D: q.option_d || "Option D",
              },
              topic: q.topic || "General",
            })) || [],
          weakTopics: response.data.weak_topics || [],
          feedback: response.data.feedback || response.data.ai_feedback || "No overall feedback available",
          submittedAt: response.data.submitted_at || response.data.end_time || new Date().toISOString(),
        }
        setResults(formattedResults)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token")
          navigate("/login")
        } else {
          setError(err.response?.data?.error || err.message || "Failed to load results")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [attemptId, navigate, role, roleLoading])

  if (roleLoading)
    return (
      <div className="result-page-wrapper">
        <div className="floating-elements">
          <div className="floating-element floating-element-1"></div>
          <div className="floating-element floating-element-2"></div>
          <div className="floating-element floating-element-3"></div>
        </div>
        <div className="container-fluid h-100 d-flex align-items-center justify-content-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-white rounded-3 shadow-lg"
            style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="h5 text-primary mb-0">Verifying access...</p>
          </motion.div>
        </div>
      </div>
    )

  if (loading)
    return (
      <div className="result-page-wrapper">
        <div className="floating-elements">
          <div className="floating-element floating-element-1"></div>
          <div className="floating-element floating-element-2"></div>
          <div className="floating-element floating-element-3"></div>
        </div>
        <div className="container-fluid h-100 d-flex align-items-center justify-content-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-5 bg-white rounded-3 shadow-lg"
            style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              className="display-1 mb-4 text-primary"
            >
              📊
            </motion.div>
            <h4 className="text-primary mb-2">Analyzing your results...</h4>
            <p className="text-muted">Preparing detailed insights</p>
          </motion.div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="result-page-wrapper">
        <div className="floating-elements">
          <div className="floating-element floating-element-1"></div>
          <div className="floating-element floating-element-2"></div>
          <div className="floating-element floating-element-3"></div>
        </div>
        <div className="container-fluid h-100 d-flex align-items-center justify-content-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-5 bg-white rounded-3 shadow-lg"
            style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(255, 255, 255, 0.95)", maxWidth: "400px" }}
          >
            <div className="display-1 text-danger mb-4">⚠️</div>
            <h3 className="text-dark mb-3">Error Loading Results</h3>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={() => navigate("/student-dashboard")} className="btn btn-primary btn-lg px-4">
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    )

  if (!results)
    return (
      <div className="result-page-wrapper">
        <div className="floating-elements">
          <div className="floating-element floating-element-1"></div>
          <div className="floating-element floating-element-2"></div>
          <div className="floating-element floating-element-3"></div>
        </div>
        <div className="container-fluid h-100 d-flex align-items-center justify-content-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-5 bg-white rounded-3 shadow-lg"
            style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="display-1 text-muted mb-4">📭</div>
            <h3 className="text-dark mb-3">No Results Available</h3>
            <p className="text-muted mb-4">We couldn't find any results for this attempt.</p>
            <button onClick={() => navigate("/student-dashboard")} className="btn btn-primary btn-lg px-4">
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    )

  const getScoreColor = (score) => {
    if (score >= 80) return "success"
    if (score >= 60) return "primary"
    if (score >= 40) return "warning"
    return "danger"
  }

  const getPerformanceText = (score) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Improvement"
  }

  return (
    <div className="result-page-wrapper">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
        <div className="floating-element floating-element-4"></div>
        <div className="floating-element floating-element-5"></div>
        <div className="floating-element floating-element-6"></div>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="result-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center">
                <div className="header-icon me-3">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div>
                  <h1 className="result-title mb-1">Test Results</h1>
                  <p className="result-subtitle mb-0">Detailed performance analysis</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button type="button" onClick={() => navigate("/student-dashboard")} className="btn btn-outline-light btn-lg">
                <i className="fas fa-arrow-left me-2"></i>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container-fluid py-4">
        <div className="row">
          {/* Performance Overview */}
          <div className="col-12 mb-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="performance-card"
            >
              <div className="row align-items-center">
                <div className="col-lg-4">
                  <div className="score-display text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      className={`score-circle score-${getScoreColor(results.score)}`}
                    >
                      <div className="score-value">{results.score.toFixed(1)}%</div>
                      <div className="score-label">{getPerformanceText(results.score)}</div>
                    </motion.div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <StatCard
                        icon="fas fa-check-circle"
                        label="Correct Answers"
                        value={`${results.correctAnswers}/${results.totalQuestions}`}
                        color="success"
                        delay={0.3}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <StatCard
                        icon="fas fa-star"
                        label="Marks Obtained"
                        value={`${results.marks.obtained}/${results.marks.total}`}
                        color="primary"
                        delay={0.4}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <StatCard
                        icon="fas fa-clock"
                        label="Submitted At"
                        value={new Date(results.submittedAt).toLocaleString()}
                        color="info"
                        delay={0.5}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Questions Analysis */}
          {results.questions.length > 0 && (
            <div className="col-12 mb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="analysis-card"
              >
                <div className="analysis-header">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="analysis-icon me-3">
                        <i className="fas fa-list-alt"></i>
                      </div>
                      <div>
                        <h3 className="analysis-title mb-1">Question Analysis</h3>
                        <p className="analysis-subtitle mb-0">Detailed breakdown of each question</p>
                      </div>
                    </div>
                    <span className="question-count-badge">{results.questions.length} Questions</span>
                  </div>
                </div>

                <div className="analysis-body">
                  <AnimatePresence>
                    {results.questions.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="mb-4"
                      >
                        <QuestionResult question={question} index={index} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}

          {/* Weak Topics & Feedback */}
          <div className="col-lg-6 mb-4">
            {results.weakTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="improvement-card h-100"
              >
                <div className="improvement-header">
                  <div className="d-flex align-items-center">
                    <div className="improvement-icon me-3">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <h4 className="improvement-title mb-1">Areas for Improvement</h4>
                      <p className="improvement-subtitle mb-0">Focus on these topics</p>
                    </div>
                  </div>
                </div>
                <div className="improvement-body">
                  <div className="weak-topics-grid">
                    {results.weakTopics.map((topic, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                        className="weak-topic-item"
                      >
                        <i className="fas fa-book me-2"></i>
                        {topic}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="col-lg-6 mb-4">
            {results.feedback && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="feedback-card h-100"
              >
                <div className="feedback-header">
                  <div className="d-flex align-items-center">
                    <div className="feedback-icon me-3">
                      <i className="fas fa-lightbulb"></i>
                    </div>
                    <div>
                      <h4 className="feedback-title mb-1">AI Feedback</h4>
                      <p className="feedback-subtitle mb-0">Personalized insights</p>
                    </div>
                  </div>
                </div>
                <div className="feedback-body">
                  <div className="feedback-content">
                    {results.feedback.split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon, label, value, color, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className={`stat-card stat-card-${color}`}
    >
      <div className="d-flex align-items-center">
        <div className="stat-icon me-3">
          <i className={icon}></i>
        </div>
        <div className="flex-grow-1">
          <p className="stat-label mb-1">{label}</p>
          <p className="stat-value mb-0">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Question Result Component
const QuestionResult = ({ question, index }) => {
  return (
    <div className={`question-result-card ${question.isCorrect ? "correct" : "incorrect"}`}>
      <div className="question-result-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className={`result-status-icon ${question.isCorrect ? "correct" : "incorrect"}`}>
              <i className={`fas ${question.isCorrect ? "fa-check" : "fa-times"}`}></i>
            </div>
            <div className="ms-3">
              <h5 className="question-result-title mb-1">Question {index + 1}</h5>
              <span className="question-topic-badge">{question.topic}</span>
            </div>
          </div>
          <span className={`question-type-badge ${question.questionType.toLowerCase()}`}>{question.questionType}</span>
        </div>
      </div>

      <div className="question-result-body">
        <div className="question-content mb-4">
          <p className="question-text">{question.content}</p>
        </div>

        {question.questionType === "MCQ" ? (
          <MCQResult
            options={question.options}
            correctOption={question.correctOption}
            studentAnswer={question.studentAnswer}
          />
        ) : (
          <QNAResult studentAnswer={question.studentAnswer} modelAnswer={question.modelAnswer} />
        )}

        <div className="feedback-section">
          <div className="feedback-header-small">
            <i className="fas fa-comment-alt me-2"></i>
            <strong>Feedback</strong>
          </div>
          <p className="feedback-text">{question.feedback}</p>
        </div>
      </div>
    </div>
  )
}

// MCQ Result Component
const MCQResult = ({ options, correctOption, studentAnswer }) => (
  <div className="answer-section mb-4">
    <div className="row g-3 mb-4">
      {["A", "B", "C", "D"].map((opt) => (
        <div key={opt} className="col-md-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`option-result ${
              correctOption === opt ? "correct-option" : studentAnswer === opt ? "selected-option" : "default-option"
            }`}
          >
            <div className="d-flex align-items-center">
              <span className="option-letter me-3">{opt}</span>
              <span className="option-text">{options[opt]}</span>
              {correctOption === opt && <i className="fas fa-check-circle ms-auto text-success"></i>}
              {studentAnswer === opt && correctOption !== opt && (
                <i className="fas fa-times-circle ms-auto text-danger"></i>
              )}
            </div>
          </motion.div>
        </div>
      ))}
    </div>
    <div className="row g-3">
      <div className="col-sm-6">
        <div className="answer-box student-answer-box">
          <div className="answer-label">
            <i className="fas fa-user me-2"></i>
            Your Answer
          </div>
          <div className="answer-value">{studentAnswer}</div>
        </div>
      </div>
      <div className="col-sm-6">
        <div className="answer-box correct-answer-box">
          <div className="answer-label">
            <i className="fas fa-check me-2"></i>
            Correct Answer
          </div>
          <div className="answer-value">{correctOption}</div>
        </div>
      </div>
    </div>
  </div>
)

// QNA Result Component
const QNAResult = ({ studentAnswer, modelAnswer }) => (
  <div className="answer-section mb-4">
    <div className="row g-3">
      <div className="col-12">
        <div className="answer-box student-answer-box">
          <div className="answer-label">
            <i className="fas fa-user me-2"></i>
            Your Answer
          </div>
          <div className="answer-value">{studentAnswer}</div>
        </div>
      </div>
      <div className="col-12">
        <div className="answer-box model-answer-box">
          <div className="answer-label">
            <i className="fas fa-star me-2"></i>
            Model Answer
          </div>
          <div className="answer-value">{modelAnswer}</div>
        </div>
      </div>
    </div>
  </div>
)

export default ResultPage
