import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useUserRole } from "../../auth"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Calendar,
  FileText,
  User,
  Award,
  ArrowRight,
  AlertCircle,
  Target,
  BarChart2,
  Settings,
  Bell,
  LogOut,
  Play,
  Users,
  TrendingUp,
  Star,
  Zap,
  Brain,
  Timer,
  Trophy,
  Eye,
  Download,
  Share2,
} from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./session-details-styles.css"
// import "../../global.css"


export default function SessionDetails() {
  const { sessionId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [tests, setTests] = useState([])
  const [userName, setUserName] = useState("Student")
  const [selectedTest, setSelectedTest] = useState(null)
  const navigate = useNavigate()
  const { role, loading: roleLoading } = useUserRole()
  const token = localStorage.getItem("access_token")

  const handleAttempt = async (testId) => {
    navigate(`/student/attempt-test/${testId}`)
  }

  const handleBackToDashboard = () => {
    navigate("/student-dashboard")
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  const handleTestPreview = (test) => {
    setSelectedTest(test)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "success"
      case "medium":
        return "warning"
      case "hard":
        return "danger"
      default:
        return "primary"
    }
  }

  const getTestProgress = (test) => {
    // Mock progress data - replace with actual data
    return Math.floor(Math.random() * 100)
  }

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    if (roleLoading) return

    if (role !== "student") {
      navigate("/login")
      return
    }

    const fetchSessionAndTests = async () => {
      try {
        setLoading(true)

        const response = await fetch(`http://127.0.0.1:8000/session/${sessionId}/detail/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch session details")

        const data = await response.json()
        console.log("Session data:", data)
        setSession(data.session)
        setTests(data.unattempted_tests)

        // Get user name if available
        if (data.session && data.session.student && data.session.student.username) {
          setUserName(data.session.student.username)
        }
      } catch (err) {
        console.error(`Error fetching session ${sessionId}:`, err)
        setError(`Failed to load session details`)
      } finally {
        setLoading(false)
      }
    }

    fetchSessionAndTests()
  }, [sessionId, role, roleLoading, navigate, token])

  if (roleLoading || loading) {
    return (
      <div className="session-redesign-wrapper min-vh-100 d-flex justify-content-center align-items-center">
        <motion.div
          className="loading-container text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="loading-spinner mb-4">
            <motion.div
              className="spinner-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Brain size={32} />
            </motion.div>
          </div>
          <h3 className="loading-title">Loading Session</h3>
          <p className="loading-subtitle">Preparing your learning experience...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="session-redesign-wrapper min-vh-100 d-flex justify-content-center align-items-center p-4">
        <motion.div className="error-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="error-icon">
            <AlertCircle size={48} />
          </div>
          <h3 className="error-title">Oops! Something went wrong</h3>
          <p className="error-message">{error}</p>
          <button onClick={handleBackToDashboard} className="btn btn-primary">
            <ArrowLeft size={16} className="me-2" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="session-redesign-wrapper min-vh-100">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`floating-element floating-element-${i + 1}`}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="container-fluid">
        <div className="row">
          {/* Enhanced Top Navigation */}
          <div className="col-12 px-0">
            <motion.div
              className="top-nav-redesign"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="container">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-3">
                      <div className="logo-container-redesign">
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                          <CheckCircle className="logo-icon" />
                        </motion.div>
                      </div>
                      <div>
                        <h4 className="brand-name mb-0">SmartAssess</h4>
                        <p className="brand-tagline mb-0">Learn. Assess. Excel.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center justify-content-end gap-3">
                      <div className="user-profile-redesign">
                        <div className="user-avatar-redesign">
                          <User size={18} />
                        </div>
                        <div className="user-info d-none d-md-block">
                          <span className="user-name">{userName}</span>
                        </div>
                      </div>
                      <div className="nav-actions">
                        <button onClick={handleLogout} className="nav-action-btn logout-btn">
                          <LogOut size={18} /> 
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="col-12">
            <div className="main-content-redesign">
              {/* Hero Section */}
              <motion.div
                className="hero-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="container">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="breadcrumb-nav">
                        <button onClick={handleBackToDashboard} className="breadcrumb-btn">
                          <ArrowLeft size={16} />
                          Dashboard
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">Session Details</span>
                      </div>
                      <h1 className="hero-title">{session?.session_name || "Session Details"}</h1>
                      <p className="hero-subtitle">
                        {session?.description || "Explore available tests and track your progress"}
                      </p>
                    </div>
                    <div className="col-md-4 text-md-end">
                      <div className="hero-actions">
                        <button
                          onClick={() => navigate("/student/attempted-tests")}
                          className="btn btn-primary hero-btn"
                        >
                          <BarChart2 size={18} className="me-2" />
                          View Progress
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tests Grid */}
              <div className="tests-section">
                <div className="container">
                  <motion.div
                    className="section-header-redesign"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h2 className="section-title-redesign">
                          <Zap size={28} className="me-3" />
                          Ready to Test Your Knowledge?
                        </h2>
                        <p className="section-subtitle-redesign">
                          Choose from below available assessments designed to challenge and improve your skills
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {tests.length === 0 ? (
                    <motion.div
                      className="empty-state-redesign"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                    >
                      <div className="empty-illustration">
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        >
                          <Brain size={80} />
                        </motion.div>
                      </div>
                      <h3 className="empty-title">No Tests Available Yet</h3>
                      <p className="empty-description">
                        Your instructor hasn't published any tests for this session yet. Check back soon or contact your
                        instructor for more information.
                      </p>
                      <div className="empty-actions">
                        <button onClick={handleBackToDashboard} className="btn btn-primary">
                          <ArrowLeft size={16} className="me-2" />
                          Return to Dashboard
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="row g-4">
                      {tests.map((test, index) => (
                        <motion.div
                          key={test.id}
                          className="col-lg-6 col-xl-4"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                        >
                          <div className="test-card-redesign">
                            <div className="test-card-header">
                              <div className="test-badge">
                                <span className={`difficulty-badge difficulty-${getDifficultyColor(test.difficulty)}`}>
                                  {test.difficulty || "Medium"}
                                </span>
                                <span className="test-type-badge">
                                  <Target size={12} />
                                  Assessment
                                </span>
                              </div>
                              <div className="test-menu">
                                <button onClick={() => handleTestPreview(test)} className="test-menu-btn">
                                  <Eye size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="test-card-body">
                              <div className="test-icon-redesign">
                                <FileText size={28} />
                              </div>
                              <h3 className="test-title-redesign">{test.title}</h3>
                              <p className="test-description-redesign">
                                {test.description ||
                                  "Test your knowledge and skills with this comprehensive assessment."}
                              </p>

                              <div className="test-metrics">
                                <div className="metric">
                                  <Clock size={16} />
                                  <span>{test.time_limit_minutes || 30} min</span>
                                </div>
                                <div className="metric">
                                  <Target size={16} />
                                  <span>{test.questions?.length || 10} questions</span>
                                </div>
                                <div className="metric">
                                  <Award size={16} />
                                  <span>{test.total_marks || 100} points</span>
                                </div>
                              </div>

                              <div className="test-progress-bar">
                                <div className="progress-label">
                                  <span>Class Average</span>
                                  <span>{getTestProgress(test)}%</span>
                                </div>
                                <div className="progress">
                                  <motion.div
                                    className="progress-bar"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getTestProgress(test)}%` }}
                                    transition={{ duration: 1, delay: 1 + index * 0.1 }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="test-card-footer">
                              <div className="test-meta">
                                <span className="test-date">
                                  <Calendar size={14} />
                                  {new Date(test.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <motion.button
                                onClick={() => handleAttempt(test.id)}
                                className="btn btn-primary test-start-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Play size={16} className="me-2" />
                                Start Test
                                <ArrowRight size={16} className="ms-2 start-arrow" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Insights */}
              <motion.div
                className="insights-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <div className="container">
                  <div className="insights-card">
                    <div className="row align-items-center">
                      <div className="col-md-8">
                        <div className="insights-content">
                          <h3 className="insights-title">
                            <Brain size={32} className="me-3" />
                            AI-Powered Learning Insights
                          </h3>
                          <p className="insights-description">
                            Get personalized recommendations, track your progress, and discover areas for improvement
                            with our advanced analytics dashboard.
                          </p>
                          <div className="insights-features">
                            <div className="feature-item">
                              <CheckCircle size={16} />
                              <span>Performance Analytics</span>
                            </div>
                            <div className="feature-item">
                              <CheckCircle size={16} />
                              <span>Personalized Recommendations</span>
                            </div>
                            <div className="feature-item">
                              <CheckCircle size={16} />
                              <span>Progress Tracking</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 d-none d-md-block">
                        <div className="insights-illustration">
                          <motion.div
                            animate={{
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 4,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          >
                            <BarChart2 size={120} />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Preview Modal */}
      <AnimatePresence>
        {selectedTest && (
          <motion.div
            className="modal-backdrop-redesign"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTest(null)}
          >
            <motion.div
              className="test-preview-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-redesign">
                <h4 className="modal-title">Test Preview</h4>
                <button onClick={() => setSelectedTest(null)} className="modal-close-btn">
                  ×
                </button>
              </div>
              <div className="modal-body-redesign">
                <h5>{selectedTest.title}</h5>
                <p>{selectedTest.description}</p>
                <div className="preview-stats">
                  <div className="preview-stat">
                    <Clock size={16} />
                    <span>{selectedTest.time_limit_minutes} minutes</span>
                  </div>
                  <div className="preview-stat">
                    <Target size={16} />
                    <span>{selectedTest.questions?.length || 10} questions</span>
                  </div>
                  <div className="preview-stat">
                    <Award size={16} />
                    <span>{selectedTest.total_marks || 100} points</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer-redesign">
                <button onClick={() => setSelectedTest(null)} className="btn btn-outline-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedTest(null)
                    handleAttempt(selectedTest.id)
                  }}
                  className="btn btn-primary"
                >
                  <Play size={16} className="me-2" />
                  Start Test
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
