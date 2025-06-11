"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  ArrowLeft,
  Settings,
  Bell,
  LogOut,
  UserCheck,
  UserX,
  AlertCircle,
  BookOpen,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  MessageSquare,
} from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./teacher-requests-styles.css"

const TeacherRequests = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingRequests, setProcessingRequests] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedSession, setSelectedSession] = useState(null)
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://127.0.0.1:8000/sessions/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Ensure sessions have pending_students array
      const formattedSessions = response.data.map((session) => ({
        ...session,
        pending_students: session.pending_students || [],
      }))
      setSessions(formattedSessions)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      setError("Failed to load enrollment requests")
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (sessionId, studentId, action) => {
    const requestKey = `${sessionId}-${studentId}`
    setProcessingRequests((prev) => new Set([...prev, requestKey]))

    try {
      await axios.patch(
        `http://127.0.0.1:8000/sessions/manage-enrollments/${sessionId}/`,
        { student_id: studentId, action },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      // Update local state instead of refetching
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              pending_students: session.pending_students.filter((student) => student.id !== studentId),
            }
          }
          return session
        }),
      )
    } catch (error) {
      console.error("Error managing enrollment:", error)
      setError("Failed to process request")
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev)
        newSet.delete(requestKey)
        return newSet
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.session_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && session.pending_students.length > 0) ||
      (filterStatus === "none" && session.pending_students.length === 0)
    return matchesSearch && matchesFilter
  })

  const totalPendingRequests = sessions.reduce((total, session) => total + session.pending_students.length, 0)

  if (loading) {
    return (
      <div className="teacher-requests-wrapper min-vh-100 d-flex justify-content-center align-items-center">
        {/* Floating Background Elements */}
        <div className="floating-elements">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`floating-element floating-element-${i + 1}`} />
          ))}
        </div>

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
              <Users size={32} />
            </motion.div>
          </div>
          <h3 className="loading-title">Loading Enrollment Requests</h3>
          <p className="loading-subtitle">Gathering student enrollment data...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="teacher-requests-wrapper min-vh-100">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`floating-element floating-element-${i + 1}`} />
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
                        <p className="brand-tagline mb-0">Manage. Approve. Excel.</p>
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
                          <span className="user-name">Teacher</span>
                          <span className="user-role">Instructor</span>
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
                        <button onClick={() => navigate("/teacher-dashboard")} className="breadcrumb-btn">
                          <ArrowLeft size={16} />
                          Dashboard
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">Enrollment Requests</span>
                      </div>
                      <h1 className="hero-title">Manage Student Enrollments</h1>
                      <p className="hero-subtitle">Review and approve student enrollment requests for your sessions</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Section */}
              <motion.div
                className="stats-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="container">
                  <div className="row g-4">
                    <div className="col-md-3">
                      <div className="stat-card-redesign stat-primary">
                        <div className="stat-icon">
                          <BookOpen size={24} />
                        </div>
                        <div className="stat-content">
                          <h3 className="stat-number">{sessions.length}</h3>
                          <p className="stat-label">Total Sessions</p>
                        </div>
                        <div className="stat-trend">
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-card-redesign stat-warning">
                        <div className="stat-icon">
                          <Clock size={24} />
                        </div>
                        <div className="stat-content">
                          <h3 className="stat-number">{totalPendingRequests}</h3>
                          <p className="stat-label">Pending Requests</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="filters-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="container">
                  <div className="filters-card">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <div className="search-container">
                          <Search size={20} className="search-icon" />
                          <input
                            type="text"
                            className="search-input"
                            placeholder="Search sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="filter-container">
                          <Filter size={20} className="filter-icon" />
                          <select
                            className="filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="all">All Sessions</option>
                            <option value="pending">With Pending Requests</option>
                            <option value="none">No Pending Requests</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="container"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="alert alert-danger d-flex align-items-center">
                      <AlertCircle size={20} className="me-2" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sessions List */}
              <div className="sessions-section">
                <div className="container">
                  {filteredSessions.length === 0 ? (
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
                          <Users size={80} />
                        </motion.div>
                      </div>
                      <h3 className="empty-title">No Enrollment Requests</h3>
                      <p className="empty-description">
                        {searchTerm || filterStatus !== "all"
                          ? "No sessions match your current filters. Try adjusting your search criteria."
                          : "You don't have any pending enrollment requests at the moment. Students will appear here when they request to join your sessions."}
                      </p>
                      <div className="empty-actions">
                        <button onClick={() => navigate("/teacher-dashboard")} className="btn btn-primary">
                          <ArrowLeft size={16} className="me-2" />
                          Back to Dashboard
                        </button>
                        {(searchTerm || filterStatus !== "all") && (
                          <button
                            onClick={() => {
                              setSearchTerm("")
                              setFilterStatus("all")
                            }}
                            className="btn btn-outline-primary"
                          >
                            <RefreshCw size={16} className="me-2" />
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="row g-4">
                      {filteredSessions.map((session, index) => (
                        <motion.div
                          key={session.id}
                          className="col-12"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                        >
                          <div className="session-request-card">
                            <div className="session-card-header">
                              <div className="session-info">
                                <div className="session-icon-container">
                                  <BookOpen size={24} />
                                </div>
                                <div className="session-details">
                                  <h3 className="session-title">{session.session_name}</h3>
                                  <p className="session-description">
                                    {session.description || "No description provided"}
                                  </p>
                                  <div className="session-meta">
                                    <span className="meta-item">
                                      <Calendar size={14} />
                                      Created: {new Date(session.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="meta-item">
                                      <Users size={14} />
                                      {session.pending_students.length} pending request
                                      {session.pending_students.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="session-actions">
                                <button
                                  onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                                  className="btn btn-outline-primary session-action-btn"
                                >
                                  <Eye size={16} />
                                  {selectedSession === session.id ? "Hide" : "View"} Details
                                </button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {selectedSession === session.id && (
                                <motion.div
                                  className="session-card-body"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {session.pending_students.length === 0 ? (
                                    <div className="no-requests-message">
                                      <CheckCircle size={24} className="text-success" />
                                      <span>No pending enrollment requests for this session</span>
                                    </div>
                                  ) : (
                                    <div className="pending-students-list">
                                      <h5 className="pending-title">
                                        <Clock size={18} className="me-2" />
                                        Pending Student Enrollments
                                      </h5>
                                      <div className="students-grid">
                                        {session.pending_students.map((student, studentIndex) => {
                                          const requestKey = `${session.id}-${student.id}`
                                          const isProcessing = processingRequests.has(requestKey)

                                          return (
                                            <motion.div
                                              key={student.id}
                                              className="student-request-card"
                                              initial={{ opacity: 0, x: -20 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: studentIndex * 0.1 }}
                                            >
                                              <div className="student-info">
                                                <div className="student-avatar">
                                                  <User size={20} />
                                                </div>
                                                <div className="student-details">
                                                  <h6 className="student-name">
                                                    {student.full_name || student.username || "Unknown Student"}
                                                  </h6>
                                                  <p className="student-email">
                                                    <Mail size={14} className="me-1" />
                                                    {student.email}
                                                  </p>
                                                  <span className="request-date">
                                                    Requested: {new Date().toLocaleDateString()}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="student-actions">
                                                <motion.button
                                                  onClick={() => handleApproval(session.id, student.id, "approve")}
                                                  disabled={isProcessing}
                                                  className="btn btn-success btn-sm student-action-btn"
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  {isProcessing ? (
                                                    <motion.div
                                                      animate={{ rotate: 360 }}
                                                      transition={{
                                                        duration: 1,
                                                        repeat: Number.POSITIVE_INFINITY,
                                                        ease: "linear",
                                                      }}
                                                    >
                                                      <RefreshCw size={14} />
                                                    </motion.div>
                                                  ) : (
                                                    <CheckCircle size={14} />
                                                  )}
                                                  <span className="d-none d-md-inline ms-1">Approve</span>
                                                </motion.button>
                                                <motion.button
                                                  onClick={() => handleApproval(session.id, student.id, "reject")}
                                                  disabled={isProcessing}
                                                  className="btn btn-danger btn-sm student-action-btn"
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <XCircle size={14} />
                                                  <span className="d-none d-md-inline ms-1">Reject</span>
                                                </motion.button>
                                                <button className="btn btn-outline-secondary btn-sm student-action-btn">
                                                  <MessageSquare size={14} />
                                                  <span className="d-none d-md-inline ms-1">Message</span>
                                                </button>
                                              </div>
                                            </motion.div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherRequests
