import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { useUserRole } from "../../auth"
import { motion, AnimatePresence } from "framer-motion"
import "./attempt-test-styles.css"
// import "../../global.css"


const QUESTION_TYPES = {
  MCQ: "MCQ",
  QNA: "QNA",
}

const AttemptTest = () => {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { role, loading: roleLoading } = useUserRole()
  const token = localStorage.getItem("access_token")

  const [testDetails, setTestDetails] = useState(null)
  const [questions, setQuestions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  const [answerStatus, setAnswerStatus] = useState({})

  useEffect(() => {
    // Redirect if not authenticated or not a student
    if (!token) {
      navigate("/login")
      return
    }

    if (!roleLoading && role !== "student") {
      navigate("/login")
      return
    }
  }, [role, roleLoading, navigate, token])

  useEffect(() => {
    if (roleLoading || !token || role !== "student") return

    const fetchTestData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get(`http://127.0.0.1:8000/student/attempt-test/${testId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        })

        if (response?.data) {
          setTestDetails({
            title: response.data.title || "Untitled Test",
            attemptId: response.data.attempt_id,
            timeLimit: response.data.time_limit_minutes,
          })
          setQuestions(response.data.questions || [])
          if (response.data.time_limit_minutes) {
            setTimeRemaining(response.data.time_limit_minutes * 60)
          }
        } else {
          throw new Error("Invalid server response")
        }
      } catch (err) {
        console.error("Fetch Test Error:", err)
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token")
          navigate("/login")
        } else {
          setError(err?.response?.data?.error || err.message || "Failed to fetch test")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTestData()
  }, [testId, token, role, roleLoading, navigate])

  useEffect(() => {
    if (timeRemaining === null) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  // Update answer status whenever answers change
  useEffect(() => {
    const newStatus = {}
    questions.forEach((q) => {
      if (answers[q.id]) {
        newStatus[q.id] = true
      } else {
        newStatus[q.id] = false
      }
    })
    setAnswerStatus(newStatus)
  }, [answers, questions])

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleAutoSubmit = async () => {
    if (Object.keys(answers).length > 0 && !submitting) {
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (submitting) return

    try {
      setSubmitting(true)

      // 1. Convert answers to array format with string IDs
      const formattedAnswers = Object.entries(answers).map(([qid, answer]) => ({
        question_id: String(qid), // Convert to string to match backend
        answer: answer,
      }))

      if (formattedAnswers.length === 0) {
        throw new Error("No valid answers to submit")
      }

      // 2. Prepare payload
      const payload = {
        attempt_id: testDetails?.attemptId ? String(testDetails.attemptId) : null,
        answers: formattedAnswers,
        test_id: String(testId), // Consistent string IDs
      }

      // 3. Submit to backend
      const response = await axios.post(`http://127.0.0.1:8000/student/submit-test/${testId}/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.data?.attempt_id) {
        throw new Error("Invalid server response")
      }

      navigate(`/result-page/${response.data.attempt_id}`)
    } catch (error) {
      console.error("Complete error details:", {
        message: error.message,
        response: error.response?.data,
        config: error.config,
      })

      alert(error.response?.data?.error || error.message || "Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const toggleViewMode = () => {
    setShowAllQuestions((prev) => !prev)
  }

  if (roleLoading) {
    return (
      <div className="test-loading-container">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Preparing Your Test Environment</h2>
          <p>Verifying access permissions...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="test-loading-container">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading Test Questions</h2>
          <p>Preparing your personalized assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="test-error-container">
        <div className="error-icon">❌</div>
        <h2>Something Went Wrong</h2>
        <p>{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="test-container">
      {/* Floating background elements */}
      <div className="floating-elements">
        <div className="float float-1"></div>
        <div className="float float-2"></div>
        <div className="float float-3"></div>
        <div className="float float-4"></div>
      </div>

      {/* Test Header */}
      <motion.div
        className="test-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1 className="test-title">{testDetails?.title}</h1>
          <div className="test-meta">
            <div className="question-counter">
              <span className="current">{currentQuestionIndex + 1}</span>
              <span className="divider">/</span>
              <span className="total">{questions.length}</span>
              <span className="label">Questions</span>
            </div>

            {timeRemaining !== null && (
              <div className="timer-container">
                <div className="timer-icon">⏱️</div>
                <div className="timer">
                  <div className="timer-label">Time Remaining</div>
                  <div className="timer-value">{formatTime(timeRemaining)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="view-toggle-container">
          <button
            className={`view-toggle-button ${showAllQuestions ? "list-active" : "single-active"}`}
            onClick={toggleViewMode}
          >
            <span className="single-view-icon">1️⃣</span>
            <span className="list-view-icon">📋</span>
            <span className="view-toggle-label">
              {showAllQuestions ? "Single Question View" : "All Questions View"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Progress Indicators */}
      <div className="progress-indicators">
        {questions.map((q, idx) => (
          <button
            key={`indicator-${q.id}`}
            className={`progress-dot ${idx === currentQuestionIndex ? "active" : ""} ${answerStatus[q.id] ? "answered" : ""}`}
            onClick={() => setCurrentQuestionIndex(idx)}
            aria-label={`Go to question ${idx + 1}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Questions Container */}
      <div className={`questions-container ${showAllQuestions ? "all-questions" : ""}`}>
        {!showAllQuestions ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`question-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="single-question-view"
            >
              {questions[currentQuestionIndex] && (
                <QuestionCard
                  question={questions[currentQuestionIndex]}
                  index={currentQuestionIndex}
                  answer={answers[questions[currentQuestionIndex].id] || ""}
                  onAnswerChange={handleAnswerChange}
                  isLast={currentQuestionIndex === questions.length - 1}
                  onNext={goToNextQuestion}
                  onPrev={goToPrevQuestion}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            className="all-questions-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {questions.map((q, index) => (
              <motion.div
                key={`all-q-${q.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <QuestionCard
                  question={q}
                  index={index}
                  answer={answers[q.id] || ""}
                  onAnswerChange={handleAnswerChange}
                  isLast={index === questions.length - 1}
                  compact={true}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Navigation and Submit */}
      <motion.div
        className="test-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="test-stats">
          <div className="stats-item">
            <span className="stats-label">Answered</span>
            <span className="stats-value">
              {Object.keys(answers).length}/{questions.length}
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="submit-button"
          disabled={Object.keys(answers).length === 0 || submitting}
        >
          {submitting ? (
            <>
              <span className="submit-spinner"></span>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span className="submit-icon">✓</span>
              <span>Submit Test</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}

// Question Card Component
const QuestionCard = ({ question, index, answer, onAnswerChange, isLast, onNext, onPrev, compact = false }) => {
  return (
    <div
      className={`question-card ${question.question_type === QUESTION_TYPES.QNA ? "qna-type" : "mcq-type"} ${compact ? "compact" : ""}`}
    >
      <div className="question-header">
        <div className="question-meta">
          <span className="question-number">Question {index + 1}</span>
          <div className="question-badges">
            <span className="question-marks">
              <span className="marks-icon">🏆</span>
              {question.marks || 1} {question.marks > 1 ? "Marks" : "Mark"}
            </span>
            <span className={`question-type-badge ${question.question_type === QUESTION_TYPES.QNA ? "qna" : "mcq"}`}>
              {question.question_type === QUESTION_TYPES.QNA ? "Written Answer" : "Multiple Choice"}
            </span>
          </div>
        </div>
      </div>

      <div className="question-content-wrapper">
        <h3 className="question-content">{question.content}</h3>
      </div>

      <div className="answer-section">
        {question.question_type === QUESTION_TYPES.MCQ ? (
          <div className={`mcq-options ${compact ? "compact-options" : ""}`}>
            {Object.entries(question.options)
              .filter(([key]) => key !== "correct")
              .map(([key, value]) => (
                <label
                  key={key}
                  className={`mcq-option ${answer === key ? "selected" : ""}`}
                  htmlFor={`q-${question.id}-${key}`}
                >
                  <input
                    type="radio"
                    id={`q-${question.id}-${key}`}
                    name={`q-${question.id}`}
                    value={key}
                    checked={answer === key}
                    onChange={() => onAnswerChange(question.id, key)}
                    className="mcq-input"
                  />
                  <div className="option-content">
                    <div className="custom-radio">
                      <div className="radio-inner"></div>
                    </div>
                    <div className="option-text-wrapper">
                      <span className="option-letter">{key}</span>
                      <span className="option-text">{value}</span>
                    </div>
                  </div>
                </label>
              ))}
          </div>
        ) : (
          <div className="qna-answer">
            <textarea
              value={answer}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder="Type your detailed answer here..."
              rows={compact ? 3 : 5}
              className="qna-textarea"
            />
          </div>
        )}
      </div>

      {!compact && (
        <div className="question-navigation">
          <button className="nav-button prev-button" onClick={onPrev} disabled={index === 0}>
            Previous
          </button>
          <button className="nav-button next-button" onClick={onNext} disabled={isLast}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AttemptTest
