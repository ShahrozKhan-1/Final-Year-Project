import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useUserRole } from "../../auth.js"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Users,
  Plus,
  Trash2,
  BarChart2,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  Settings,
  Bell,
  LogOut,
  Edit3,
  Play,
  Pause,
  Award,
  Target,
  TrendingUp,
  Mail,
  Phone,
} from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./Teacher-Session-Styles.css"
// import "../../global.css"


const TeacherSessionPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [loadingTests, setLoadingTests] = useState(true)
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [error, setError] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  const { role, loading: roleLoading } = useUserRole()

  const [stats, setStats] = useState({
    total_tests: 0,
    enrolled_students: 0,
    active_tests: 0,
    average_score: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios
      .get(`http://127.0.0.1:8000/stats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setStats(response.data);
      })
      .catch((error) => {
        console.error("Error fetching stats:", error);
      });
  }, [sessionId]);

  useEffect(() => {
    if (!roleLoading && role !== "teacher") {
      navigate("/unauthorized")
      return
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token")

        // Fetch session info
        const sessionRes = await axios.get(`http://127.0.0.1:8000/sessions/${sessionId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSessionInfo(sessionRes.data)

        // Fetch tests
        const testsRes = await axios.get(`http://127.0.0.1:8000/teacher/session/${sessionId}/tests/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const testsData = testsRes.data
        if (Array.isArray(testsData)) {
          setTests(testsData)
        } else if (Array.isArray(testsData.tests)) {
          setTests(testsData.tests)
        } else {
          console.error("Unexpected tests response:", testsData)
          setTests([])
        }
        setLoadingTests(false)

        // Fetch students
        const studentsRes = await axios.get(`http://127.0.0.1:8000/sessions/${sessionId}/students/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setStudents(studentsRes.data)
        setLoadingStudents(false)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setError("Failed to load session data. Please try again.")
        setLoadingTests(false)
        setLoadingStudents(false)
      }
    }

    if (role === "teacher") {
      fetchData()
    }
  }, [sessionId, role, roleLoading, navigate])

  const handleDeleteTest = async (testId) => {
    try {
      const token = localStorage.getItem("access_token")
      await axios.delete(`http://127.0.0.1:8000/api/tests/${testId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTests((prevTests) => prevTests.filter((test) => test.id !== testId))
      setConfirmDeleteId(null)
    } catch (error) {
      console.error("Failed to delete test:", error)
      setError("Failed to delete test. Please try again.")
      setConfirmDeleteId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  if (roleLoading) {
    return (
      <div className="session-wrapper min-vh-100 d-flex justify-content-center align-items-center">
        <div className="loading-container text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="fs-5 fw-semibold">Checking permissions...</div>
        </div>
      </div>
    )
  }

  if (role !== "teacher") {
    return (
      <div className="session-wrapper min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger">You don't have permission to access this page.</div>
      </div>
    )
  }

  if (loadingTests || loadingStudents) {
    return (
      <div className="session-wrapper min-vh-100 d-flex justify-content-center align-items-center">
        <div className="loading-container text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="fs-5 fw-semibold">Loading session data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="session-wrapper min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger d-flex align-items-center">
          <AlertCircle size={20} className="me-2" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="session-wrapper min-vh-100">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`floating-element floating-element-${i + 1}`} />
        ))}
      </div>
      <div className="container-fluid">
        <div className="row">
          {/* Top Navigation */}
          <div className="col-12 px-0">
            <div className="top-nav d-flex justify-content-between align-items-center px-4 py-3">
              <div className="d-flex align-items-center gap-3">
                <div className="logo-container">
                  <CheckCircle className="logo-icon" />
                </div>
                <h4 className="mb-0 fw-bold d-none d-md-block">SmartAssess</h4>
              </div>

              <div className="d-flex align-items-center gap-3">
                <button
                  onClick={() => navigate("/teacher-dashboard")}
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                >
                  <BookOpen size={16} />
                  <span className="d-none d-md-inline">Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                >
                  <LogOut size={16} />
                  <span className="d-none d-md-inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="main-content p-4">
              {/* Header Section */}
              <div className="session-header mb-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h1 className="display-6 fw-bold mb-2">{sessionInfo?.session_name || "Session Details"}</h1>
                      <p className="text-muted d-flex align-items-center gap-2">
                        <Calendar size={16} />
                        {sessionInfo?.description || "Manage tests and students for this session"}
                      </p>
                    </motion.div>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <motion.button
                      onClick={() => navigate(`/create-test/${sessionId}`)}
                      className="btn btn-primary px-4 py-2 rounded-pill d-flex align-items-center gap-2 ms-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ y: -5 }}
                    >
                      <Plus size={18} />
                      Create New Test
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="row g-4 mb-5">
                <div className="col-md-3">
                  <motion.div
                    className="stat-card stat-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="stat-icon">
                      <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                      <p className="stat-title">Total Tests</p>
                      <h3 className="stat-value">{tests.length}</h3>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-3">
                  <motion.div
                    className="stat-card stat-teal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="stat-icon">
                      <Users size={24} />
                    </div>
                    <div className="stat-content">
                      <p className="stat-title">Enrolled Students</p>
                      <h3 className="stat-value">{students.length}</h3>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-3">
                  <motion.div
                    className="stat-card stat-blue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="stat-icon">
                      <Target size={24} />
                    </div>
                    <div className="stat-content">
                      <p className="stat-title">Active Tests</p>
                      <h3 className="stat-value">{tests.filter((test) => test.is_active).length}</h3>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-3">
                  <motion.div
                    className="stat-card stat-success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="stat-icon">
                      <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                      <p className="stat-title">Avg. Score</p>
                      <h3 className="stat-value"> {sessionInfo.average_score} </h3>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Tests Section */}
              <div className="mb-5">
                <div className="section-header mb-4">
                  <h2 className="section-title">
                    <BookOpen size={24} className="me-2 " />
                    Tests in This Session  
                  </h2>
                  <span className="ms-2 section-count">{tests.length} tests</span>
                </div>

                {tests.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-state-content">
                      <div className="empty-icon-container">
                        <BookOpen size={48} />
                      </div>
                      <h3 className="empty-title">No Tests Created Yet</h3>
                      <p className="empty-description">
                        Create your first test to start assessing your students. Tests help you evaluate learning
                        progress and identify areas for improvement.
                      </p>
                      <button
                        onClick={() => navigate(`/create-test/${sessionId}`)}
                        className="btn btn-primary btn-lg d-flex align-items-center gap-2"
                      >
                        <Plus size={20} />
                        Create Your First Test
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="row g-4">
                    {tests.map((test, index) => (
                      <motion.div
                        key={test.id}
                        className="col-lg-6 col-xl-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className="test-card">
                          <div className="test-card-header">
                            <div className="test-status-badge">
                              <div className={`status-indicator ${test.is_active ? "active" : "inactive"}`}>
                                {test.is_active ? <Play size={12} /> : <Pause size={12} />}
                              </div>
                              <span className="status-text">{test.is_active ? "Active" : "Inactive"}</span>
                            </div>
                            <div className="test-menu">
                              <button
                                className="btn btn-sm btn-light rounded-circle"
                                onClick={() => setConfirmDeleteId(test.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="test-card-body">
                            <div className="test-icon-container">
                              <BookOpen size={24} />
                            </div>
                            <h3 className="test-title">{test.title}</h3>
                            <p className="test-description">{test.description || "No description provided"}</p>

                            <div className="test-stats">
                              <div className="test-stat">
                                <Clock size={16} />
                                <span>{test.time_limit_minutes} min</span>
                              </div>
                              <div className="test-stat">
                                <Target size={16} />
                                <span>{test.questions?.length || 0} questions</span>
                              </div>
                              <div className="test-stat">
                                <Award size={16} />
                                <span>{test.total_marks || 0} marks</span>
                              </div>
                            </div>

                            <div className="test-meta">
                              <div className="test-date">
                                <Calendar size={14} />
                                <span>Created {new Date(test.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="test-card-footer">
                            <button
                              onClick={() => navigate(`/teacher/test/${test.id}`)}
                              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => navigate(`/teacher/tests/${test.id}/attempts`)}
                              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                            >
                              <BarChart2 size={14} />
                              Results
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Students Section */}
              <div className="mb-5">
                <div className="section-header mb-4">
                  <h2 className="section-title">
                    <Users size={24} className="me-2" />
                    Enrolled Students
                  </h2>
                  <span className="section-count">{students.length} students</span>
                </div>

                {students.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-state-content">
                      <div className="empty-icon-container">
                        <Users size={48} />
                      </div>
                      <h3 className="empty-title">No Students Enrolled</h3>
                      <p className="empty-description">
                        Students haven't enrolled in this session yet. Share the session code with your students to get
                        them started.
                      </p>
                      <button className="btn btn-outline-primary btn-lg d-flex align-items-center gap-2">
                        <Users size={20} />
                        Invite Students
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="row g-4">
                    {students.map((student, index) => (
                      <motion.div
                        key={student.id}
                        className="col-lg-6 col-xl-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className="student-card">
                          <div className="student-card-header">
                            <div className="student-avatar">
                              <User size={24} />
                            </div>
                            <div className="student-status">
                              <div className="status-dot active"></div>
                              <span className="status-text">Active</span>
                            </div>
                          </div>

                          <div className="student-card-body">
                            <h3 className="student-name">{student.full_name || student.username}</h3>
                            <div className="student-contact">
                              <div className="contact-item">
                                <Mail size={14} />
                                <span>{student.email}</span>
                              </div>
                              {student.phone && (
                                <div className="contact-item">
                                  <Phone size={14} />
                                  <span>{student.phone}</span>
                                </div>
                              )}
                            </div>

                            <div className="student-stats">
                              <div className="student-stat">
                                <div className="stat-value"> {stats.total_tests} </div>
                                <div className="stat-label">Tests Taken</div>
                              </div>
                              <div className="student-stat">
                                <div className="stat-value"> {stats.average_score} %</div>
                                <div className="stat-label">Avg Score</div>
                              </div>
                              <div className="student-stat">
                                <div className="stat-value">A</div>
                                <div className="stat-label">Grade</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Confirmation Modal */}
              <AnimatePresence mode="wait">
                {confirmDeleteId && (
                  <motion.div
                    className="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="modal-content confirmation-modal"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                    >
                      <div className="modal-header">
                        <div className="modal-icon">
                          <AlertCircle size={24} />
                        </div>
                        <h5 className="modal-title">Delete Test</h5>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to delete this test? This action cannot be undone and all associated
                          data will be permanently removed.
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn btn-light d-flex align-items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteTest(confirmDeleteId)}
                          className="btn btn-danger d-flex align-items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete Test
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherSessionPage
