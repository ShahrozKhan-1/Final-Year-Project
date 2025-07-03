import { useEffect, useState, useRef, useCallback } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { useUserRole } from "../../auth"
import { motion, AnimatePresence } from "framer-motion"
import "./attempt-test-styles.css"
import {
  saveAnswersToIndexedDB,
  getAnswersFromIndexedDB,
  savePendingSubmission,
  clearTestData,
  getPendingSubmission,
} from "../../Components/indexedDBUtils"

const QUESTION_TYPES = {
  MCQ: "MCQ",
  QNA: "QNA",
}

// Utility function outside component to prevent recreation
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const AttemptTest = () => {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { role, loading: roleLoading } = useUserRole()
  const token = localStorage.getItem("access_token")

  // State management
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
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Refs for stable references
  const blurCountRef = useRef(0)
  const timerRef = useRef(null)
  const submitAttemptedRef = useRef(false)
  const mountedRef = useRef(true)
  const saveAnswersRef = useRef(null)

  // Create debounced save function once
  useEffect(() => {
    saveAnswersRef.current = debounce(async (testId, answers) => {
      try {
        await saveAnswersToIndexedDB(testId, answers)
        console.log("Answers saved to IndexedDB")
      } catch (error) {
        console.error("Failed to save answers:", error)
      }
    }, 500)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log("Component state:", {
      roleLoading,
      role,
      token: !!token,
      loading,
      error,
      testId,
      questionsLength: questions.length,
    })
  }, [roleLoading, role, token, loading, error, testId, questions.length])

  // Authentication check - simplified
  useEffect(() => {
    console.log("Auth check:", { token: !!token, roleLoading, role })

    if (!token) {
      console.log("No token, redirecting to login")
      navigate("/login")
      return
    }

    if (!roleLoading && role && role !== "student") {
      console.log("Not a student, redirecting to login")
      navigate("/login")
      return
    }
  }, [token, role, roleLoading, navigate])

  // Fetch test data - simplified with better error handling
  useEffect(() => {
    // Don't fetch if still loading role or no token or wrong role
    if (roleLoading || !token) {
      console.log("Waiting for auth:", { roleLoading, token: !!token })
      return
    }

    if (role && role !== "student") {
      console.log("Wrong role, not fetching")
      return
    }

    const fetchTestData = async () => {
      try {
        console.log("Starting to fetch test data for testId:", testId)
        setLoading(true)
        setError(null)

        const response = await axios.get(`http://127.0.0.1:8000/student/attempt-test/${testId}/`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        })

        console.log("Test data received:", response.data)

        if (mountedRef.current) {
          setTestDetails({
            title: response.data.title,
            attemptId: response.data.attempt_id,
            timeLimit: response.data.time_limit_minutes,
          })

          setQuestions(response.data.questions || [])

          if (response.data.time_limit_minutes) {
            setTimeRemaining(response.data.time_limit_minutes * 60)
          }

          setLoading(false)
        }
      } catch (err) {
        console.error("Fetch Test Error:", err)
        if (mountedRef.current) {
          setError(err?.response?.data?.error || err.message || "Failed to fetch test data")
          setLoading(false)
        }
      }
    }

    fetchTestData()
  }, [testId, token, role, roleLoading]) // Simplified dependencies

  // Load saved answers from IndexedDB
  useEffect(() => {
    if (!testId) return

    const loadAnswers = async () => {
      try {
        console.log("Loading saved answers for testId:", testId)
        const storedAnswers = await getAnswersFromIndexedDB(testId)
        if (storedAnswers && mountedRef.current) {
          console.log("Loaded answers:", storedAnswers)
          setAnswers(storedAnswers)
        }
      } catch (error) {
        console.error("Failed to load saved answers:", error)
      }
    }

    loadAnswers()
  }, [testId])

  // Handle answer changes
  const handleAnswerChange = useCallback(
    (questionId, value) => {
      if (submitting || submitAttemptedRef.current) return

      console.log("Answer changed:", questionId, value)

      setAnswers((prev) => {
        const updated = { ...prev, [questionId]: value }

        // Save to IndexedDB
        if (saveAnswersRef.current) {
          saveAnswersRef.current(testId, updated)
        }

        return updated
      })
    },
    [submitting, testId],
  )

  // Submit function
  const handleSubmit = useCallback(async () => {
    if (submitting || submitAttemptedRef.current) return

    console.log("Starting submission...")
    submitAttemptedRef.current = true

    const formattedAnswers = Object.entries(answers).map(([qid, answer]) => ({
      question_id: String(qid),
      answer,
    }))

    const payload = {
      attempt_id: testDetails?.attemptId ? String(testDetails.attemptId) : null,
      answers: formattedAnswers,
      test_id: String(testId),
    }

    if (!navigator.onLine) {
      try {
        await savePendingSubmission(testId, payload)
        alert("You're offline. Your test will be submitted once you're back online.")
      } catch (error) {
        console.error("Failed to save offline submission:", error)
        alert("Failed to save your answers offline. Please check your storage.")
      }
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.post(`http://127.0.0.1:8000/student/submit-test/${testId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      })

      if (!response.data?.attempt_id) {
        throw new Error("Invalid server response")
      }

      await clearTestData(testId)

      if (mountedRef.current) {
        navigate(`/result-page/${response.data.attempt_id}`)
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert(error.response?.data?.message || error.message || "Submission failed. Please try again.")
    } finally {
      if (mountedRef.current) {
        setSubmitting(false)
        submitAttemptedRef.current = false
      }
    }
  }, [answers, testDetails?.attemptId, testId, token, navigate, submitting])

  // Blur detection
  const handleBlur = useCallback(() => {
    if (submitting || submitAttemptedRef.current) return

    blurCountRef.current += 1
    console.warn(`Tab switch detected: ${blurCountRef.current}/2`)

    if (blurCountRef.current >= 2) {
      console.warn("Maximum tab switches reached. Auto-submitting test.")
      handleSubmit()
    }
  }, [handleSubmit, submitting])

  // Online/offline status tracking
  useEffect(() => {
    const handleOnline = () => {
      console.log("Back online")
      setIsOnline(true)
    }
    const handleOffline = () => {
      console.log("Gone offline")
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Auto-submit pending submissions when online
  useEffect(() => {
    if (!isOnline || submitting || !testId) return

    const trySubmitOfflineTest = async () => {
      try {
        const pending = await getPendingSubmission(testId)
        if (!pending) return

        console.log("Attempting to submit offline test...")
        setSubmitting(true)

        const response = await axios.post(`http://127.0.0.1:8000/student/submit-test/${testId}/`, pending, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        })

        if (response.data?.attempt_id) {
          await clearTestData(testId)
          if (mountedRef.current) {
            navigate(`/result-page/${response.data.attempt_id}`)
          }
        }
      } catch (err) {
        console.error("Auto-submit failed:", err)
      } finally {
        if (mountedRef.current) {
          setSubmitting(false)
        }
      }
    }

    const timeoutId = setTimeout(trySubmitOfflineTest, 1000)
    return () => clearTimeout(timeoutId)
  }, [isOnline, testId, navigate, token, submitting])

  // Timer management
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (!submitAttemptedRef.current) {
            console.log("Time's up! Auto-submitting...")
            handleSubmit()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timeRemaining, handleSubmit])

  // Update answer status
  useEffect(() => {
    const newStatus = {}
    questions.forEach((q) => {
      newStatus[q.id] = !!answers[q.id]
    })
    setAnswerStatus(newStatus)
  }, [answers, questions])

  // Anti-cheating measures
  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault()
    const disableShortcuts = (e) => {
      const forbiddenKeys = ["F12", "F11"]
      const forbiddenCombos = [
        { ctrl: true, key: "c" },
        { ctrl: true, key: "v" },
        { ctrl: true, key: "u" },
        { ctrl: true, key: "s" },
        { ctrl: true, key: "a" },
        { ctrl: true, shift: true, key: "i" },
        { ctrl: true, shift: true, key: "j" },
        { ctrl: true, shift: true, key: "c" },
      ]

      if (
        forbiddenKeys.includes(e.key) ||
        forbiddenCombos.some(
          (combo) => e.ctrlKey === combo.ctrl && e.shiftKey === !!combo.shift && e.key.toLowerCase() === combo.key,
        )
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener("contextmenu", disableContextMenu)
    document.addEventListener("keydown", disableShortcuts)
    window.addEventListener("blur", handleBlur)

    document.body.style.userSelect = "none"

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu)
      document.removeEventListener("keydown", disableShortcuts)
      window.removeEventListener("blur", handleBlur)
      document.body.style.userSelect = "auto"
    }
  }, [handleBlur])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Page unload protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitting && !submitAttemptedRef.current && Object.keys(answers).length > 0) {
        const payload = {
          attempt_id: String(testDetails?.attemptId || ""),
          answers: Object.entries(answers).map(([qid, ans]) => ({
            question_id: String(qid),
            answer: ans,
          })),
          test_id: String(testId),
        }

        savePendingSubmission(testId, payload).catch(console.error)

        e.preventDefault()
        e.returnValue = "You have unsaved test data. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [answers, testId, submitting, testDetails?.attemptId])

  // Utility functions
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

  // Early returns for loading states
  if (roleLoading) {
    console.log("Rendering role loading state")
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
    console.log("Rendering loading state")
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
          <div style={{ marginTop: "20px", fontSize: "12px", opacity: 0.7 }}>
            Debug: testId={testId}, role={role}, token={!!token}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    console.log("Rendering error state:", error)
    return (
      <div className="test-error-container">
        <div className="error-icon">❌</div>
        <h2>Something Went Wrong</h2>
        <p>{error}</p>
        <div style={{ marginTop: "20px", fontSize: "12px", opacity: 0.7 }}>
          Debug: testId={testId}, role={role}, token={!!token}
        </div>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  console.log("Rendering main component")

  return (
    <div className="test-container">
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <span className="offline-icon">📡</span>
          <span>You're offline. Answers are being saved locally.</span>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "10px",
            fontSize: "12px",
            zIndex: 9999,
            borderRadius: "4px",
          }}
        >
          <div>Questions: {questions.length}</div>
          <div>Answers: {Object.keys(answers).length}</div>
          <div>Time: {timeRemaining}</div>
          <div>Online: {isOnline ? "Yes" : "No"}</div>
        </div>
      )}

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
          <h1 className="test-title">{testDetails?.title || "Loading..."}</h1>
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
                  <div className={`timer-value ${timeRemaining <= 300 ? "warning" : ""}`}>
                    {formatTime(timeRemaining)}
                  </div>
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
      {questions.length > 0 && (
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
      )}

      {/* Questions Container */}
      {questions.length > 0 ? (
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
      ) : (
        <div className="no-questions">
          <p>No questions available for this test.</p>
        </div>
      )}

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
              style={{ width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
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
