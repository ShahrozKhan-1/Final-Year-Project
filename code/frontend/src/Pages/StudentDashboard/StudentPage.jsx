import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "../../auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  User,
  Rocket,
  Calendar,
  Clock,
  BarChart2,
  CheckCircle,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./dashboard-styles.css";
// import "../../global.css"

import NotificationCenter from "../../Components/Notification";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [testsBySession, setTestsBySession] = useState({});
  const [userName, setUserName] = useState("Student");
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const token = localStorage.getItem("access_token");

  const handleEnrollSessionClick = () => {
    navigate("/student/enroll-session");
  };

  const handleSessionClick = (sessionId) => {
    navigate(`/student/session/${sessionId}`);
  };

  const handleAttemptTestClick = (testId) => {
    navigate(`/student/test/${testId}/attempt`);
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (roleLoading) return;

    if (role !== "student") {
      navigate("/login");
      return;
    }

    const fetchEnrolledSessions = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/sessions/enrolled/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch sessions");

        const data = await response.json();
        console.log("Enrolled Sessions Data:", data);
        setSessions(data);

        // Get user name if available
        if (data.length > 0 && data[0].student && data[0].student.username) {
          setUserName(data[0].student.username);
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
        } else {
          setError("Failed to load sessions");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledSessions();
  }, [role, roleLoading, navigate, token]);

  if (roleLoading || loading) {
    return (
      <div className="dashboard-wrapper d-flex justify-content-center align-items-center min-vh-100">
        <div className="loading-container text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="fs-4 fw-semibold text-dark">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  // Get current date
  const today = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = today.toLocaleDateString("en-US", options);

  return (
    <div className="dashboard-wrapper min-vh-100">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`floating-element floating-element-${i + 1}`}
          />
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
                <NotificationCenter userRole="student" />
                <div className="nav-item d-flex align-items-center gap-2"></div>
                <button
                  onClick={() => {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
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
                      Welcome back,{" "}
                      <span className="text-primary">{userName}</span>
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
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <motion.button
                      onClick={handleEnrollSessionClick}
                      className="btn btn-primary px-4 py-2 rounded-pill d-flex align-items-center gap-2 ms-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      whileHover={{ y: -5 }}
                    >
                      <BookOpen size={18} />
                      Enroll in a Session
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="row g-4 mb-5">
                <div className="col-md-4">
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
                      <p className="stat-title">Enrolled Sessions</p>
                      <h3 className="stat-value">{sessions.length}</h3>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-4">
                  <motion.div
                    className="stat-card stat-teal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="stat-icon">
                      <FileText size={24} />
                    </div>
                    <div className="stat-content">
                      <p className="stat-title">Upcoming Tests</p>
                      <h3 className="stat-value">
                        {Object.values(testsBySession).flat().length}
                      </h3>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-4">
                  <motion.div
                    className="stat-card stat-blue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="stat-icon">
                      <BarChart2 size={24} />
                    </div>
                    <div className="stat-content">
                      <p className="stat-title">Average Score</p>
                      <h3 className="stat-value">
                        {sessions[0]?.average_score !== undefined
                          ? `${sessions[0].average_score}%`
                          : "N/A"}
                      </h3>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Sessions Section */}
              <div className="mb-5">
                <h2 className="section-title mb-4">
                  <BookOpen size={20} className="me-2" />
                  My Enrolled Sessions
                </h2>

                <div className="row g-4">
                  {sessions.length === 0 ? (
                    <div className="col-12">
                      <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Rocket className="empty-icon" size={48} />
                        <h3 className="empty-title">No Sessions Yet</h3>
                        <p className="empty-description">
                          Ready for liftoff? You're not enrolled in any sessions
                          yet.
                        </p>
                        <button
                          onClick={handleEnrollSessionClick}
                          className="btn btn-primary mt-3 d-flex align-items-center gap-2 mx-auto"
                        >
                          <BookOpen size={18} />
                          not Enroll Now
                        </button>
                      </motion.div>
                    </div>
                  ) : (
                    sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        className="col-md-6 col-lg-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div
                          className="session-card"
                          onClick={() => handleSessionClick(session.id)}
                        >
                          <div className="session-card-header">
                            <div className="session-icon">
                              <BookOpen size={20} />
                            </div>
                          </div>

                          <h3 className="session-title">
                            {session.session_name}
                          </h3>

                          <p className="session-description">
                            {session.description || "No description provided."}
                          </p>

                          <div className="session-meta">
                            <div className="session-meta-item">
                              <Clock size={16} />
                              <span>
                                Ends at:{" "}
                                {session.end_time
                                  ? new Date(session.end_time).toLocaleString(
                                      "en-US",
                                      {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      }
                                    )
                                  : "N/A"}
                              </span>
                            </div>

                            <div className="session-meta-item">
                              <FileText size={16} />
                              <span>
                                Tests: {testsBySession[session.id]?.length || 0}
                              </span>
                            </div>
                          </div>

                          <div className="session-footer">
                            <div className="instructor">
                              <User size={16} />
                              <span>{session.teacher?.username || "TBA"}</span>
                            </div>
                            <motion.div
                              className="session-arrow"
                              whileHover={{ x: 3 }}
                            >
                              <ArrowRight size={16} />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Practice Mode Section */}
              <motion.div
                className="practice-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h2 className="practice-title">
                      <Rocket size={24} className="me-2" />
                      Practice Mode
                    </h2>
                    <p className="practice-description">
                      Practice by uploading a document or topic and receive
                      AI-generated questions to prepare yourself better.
                    </p>
                    <button
                      onClick={() => navigate("/student/practice")}
                      className="btn btn-primary d-flex align-items-center gap-2"
                    >
                      <span>Go to Practice Mode</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="col-md-4 d-none d-md-block">
                    <div className="practice-illustration">
                      <FileText size={120} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
