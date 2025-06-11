import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUserRole } from "../../auth"
import CreateSession from "../../Components/CreateSession"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  BarChart2,
  CheckCircle,
  Plus,
  Download,
  Settings,
  User,
  MoreHorizontal,
  Trash2,
  Edit,
  LogOut,
} from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./teacher-dashboard-styles.css"
import NotificationCenter from "../../Components/Notification"

const StatCard = ({ title, value, color, icon }) => {
  return (
    <motion.div
      className={`stat-card stat-${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </motion.div>
  )
}

export default function TeacherDashboard() {
  const [showModal, setShowModal] = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [userName, setUserName] = useState("Teacher")
  const navigate = useNavigate()
  const { role, loading: roleLoading } = useUserRole()
  const token = localStorage.getItem("access_token")

  useEffect(() => {
    if (!token) return navigate("/login")
    if (roleLoading) return
    if (role !== "teacher") return navigate("/login")
    fetchTeacherSessions()
  }, [role, roleLoading])

  const fetchTeacherSessions = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/teacher-sessions/", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const formattedSessions = response.data.map((session) => ({
        ...session,
        student_count: session.student_count || 0,
        pending_requests: session.pending_requests || 0,
        duration_minutes: session.duration_minutes || "N/A",
        created_at: session.created_at || new Date().toISOString(),
      }))

      setSessions(formattedSessions)

      // Get teacher name if available
      if (formattedSessions.length > 0 && formattedSessions[0].teacher && formattedSessions[0].teacher.username) {
        setUserName(formattedSessions[0].teacher.username)
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      setError("Failed to load sessions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSessionCreated = () => {
    setShowModal(false)
    fetchTeacherSessions()
  }

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/sessions/${sessionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      setConfirmDeleteId(null)
    } catch (err) {
      console.error("Failed to delete session:", err)
      setError("Failed to delete session. Please try again.")
      setConfirmDeleteId(null)
    }
  }

  const goToSession = (sessionId) => navigate(`/teacher/session/${sessionId}/tests`)
  const viewResults = (sessionId) => navigate(`/teacher/session/${sessionId}/results`)

  // Statistics calculations
  const totalStudents = sessions.reduce((acc, s) => acc + (s.student_count || 0), 0)
  const totalPending = sessions.reduce((acc, s) => acc + (s.pending_requests || 0), 0)
  const upcomingSessions = sessions.filter((s) => s.start_time && new Date(s.start_time) > new Date()).length

  // Get current date
  const today = new Date()
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDate = today.toLocaleDateString("en-US", options)

  return (
    <div className="dashboard-wrapper min-vh-100">
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
                <NotificationCenter userRole="teacher" />
                <button
                  onClick={() => {
                    localStorage.removeItem("access_token")
                    localStorage.removeItem("refresh_token")
                    navigate("/login")
                  }}
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
              {/* Welcome Header */}
              <div className="welcome-section mb-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <motion.h1
                      className="display-6 fw-bold mb-2"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      Welcome back, <span className="text-primary">{userName}</span>
                    </motion.h1>
                    <motion.p
                      className="text-muted"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Calendar size={16} className="me-2" />
                      {formattedDate}
                    </motion.p>
                  </div>
                  <div className="col-md-4 d-flex justify-content-md-end mt-3 mt-md-0 gap-2">
                    <motion.button
                      onClick={() => setShowModal(true)}
                      className="btn btn-primary px-4 py-2 rounded-pill d-flex align-items-center gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ y: -5 }}
                    >
                      <Plus size={18} />
                      Add Session
                    </motion.button>
                    <motion.button
                      onClick={() => navigate("/teacher-request")}
                      className="btn btn-success px-4 py-2 rounded-pill d-flex align-items-center gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{ y: -5 }}
                    >
                      <Download size={18} />
                      Student Requests
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="row g-4 mb-5">
                <div className="col-md-6 col-lg-3">
                  <StatCard title="Total Sessions" value={sessions.length} color="blue" icon={<BookOpen size={24} />} />
                </div>
                <div className="col-md-6 col-lg-3">
                  <StatCard title="Total Students" value={totalStudents} color="teal" icon={<Users size={24} />} />
                </div>
                <div className="col-md-6 col-lg-3">
                  <StatCard title="Pending Requests" value={totalPending} color="yellow" icon={<Clock size={24} />} />
                </div>
                <div className="col-md-6 col-lg-3">
                  <StatCard
                    title="Upcoming Sessions"
                    value={upcomingSessions}
                    color="purple"
                    icon={<Calendar size={24} />}
                  />
                </div>
              </div>

              {/* Create Session Modal */}
              <AnimatePresence mode="wait">
                {showModal && (
                  <motion.div
                    className="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="modal-content"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <CreateSession onClose={handleSessionCreated} onSuccess={handleSessionCreated} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Session List */}
              <div className="mb-4">
                <h2 className="section-title">
                  <BookOpen size={20} className="me-2" />
                  My Created Sessions
                </h2>
              </div>

              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-secondary">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-state">
                  <BookOpen className="empty-icon" size={48} />
                  <h3 className="empty-title">No Sessions Yet</h3>
                  <p className="empty-description">No sessions found. Create your first session!</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary mt-3 d-flex align-items-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Create Session
                  </button>
                </div>
              ) : (
                <div className="row g-4">
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className="col-md-6 col-lg-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="session-card">
                        {/* Card Header */}
                        <div className="session-card-header">
                          <h3 className="session-title">{session.session_name}</h3>
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-light rounded-circle"
                              type="button"
                              id={`dropdownMenuButton-${session.id}`}
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            <ul className="dropdown-menu" aria-labelledby={`dropdownMenuButton-${session.id}`}>
                              <li>
                                <button
                                  className="dropdown-item d-flex align-items-center gap-2"
                                  onClick={() => goToSession(session.id)}
                                >
                                  <Edit size={14} />
                                  Manage
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item text-danger d-flex align-items-center gap-2"
                                  onClick={() => setConfirmDeleteId(session.id)}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Card Body */}
                        {session.description && <p className="session-description">{session.description}</p>}

                        <div className="session-meta">
                          <div className="session-meta-item">
                            <Calendar size={16} />
                            <span>Created: {new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="session-meta-item">
                            <Users size={16} />
                            <span>{session.student_count} students enrolled</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="session-footer">
                          <button
                            onClick={() => viewResults(session.id)}
                            className="btn btn-primary d-flex align-items-center gap-2"
                          >
                            <BarChart2 size={16} />
                            Results
                          </button>

                          <button
                            onClick={() => goToSession(session.id)}
                            className="btn btn-outline-secondary d-flex align-items-center gap-2"
                          >
                            <Settings size={16} />
                            Manage
                          </button>

                          <button
                            onClick={() => setConfirmDeleteId(session.id)}
                            className="btn btn-outline-danger d-flex align-items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

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
                      <h5 className="mb-3">Confirm Deletion</h5>
                      <p className="mb-4">
                        Are you sure you want to delete this session? This action cannot be undone.
                      </p>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn btn-light d-flex align-items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteSession(confirmDeleteId)}
                          className="btn btn-danger d-flex align-items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
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
