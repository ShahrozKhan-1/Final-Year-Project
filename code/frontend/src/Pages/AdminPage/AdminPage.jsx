import { useEffect, useState } from "react"
import axios from "axios"
import { useUserRole } from "../../auth"
import { useNavigate } from "react-router-dom"
import "./admin-page-styles.css"
// import "../../global.css"

const AdminPage = () => {
  const { role, loading: roleLoading } = useUserRole()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [pendingTeachers, setPendingTeachers] = useState([])
  const [error, setError] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState("sessions")
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  const token = localStorage.getItem("access_token")

  useEffect(() => {
    if (roleLoading) return
    if (!token || role !== "admin") {
      navigate("/login")
      return
    }
    fetchData()
  }, [role, roleLoading])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [sessionRes, teacherRes, studentRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/admin/sessions/", { headers }),
        axios.get("http://127.0.0.1:8000/api/admin/users/?role=teacher", { headers }),
        axios.get("http://127.0.0.1:8000/api/admin/users/?role=student", { headers }),
      ])

      const allTeachers = Array.isArray(teacherRes.data) ? teacherRes.data : []
      const verifiedTeachers = allTeachers.filter(t => t.is_verified)
      const unverifiedTeachers = allTeachers.filter(t => !t.is_verified)
      console.log("all teacher" ,allTeachers)
      console.log("verified teachers", verifiedTeachers)
      console.log("unverified teachers", unverifiedTeachers)

      setTeachers(verifiedTeachers)
      setPendingTeachers(unverifiedTeachers)
      setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : [])
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : [])
    } catch (err) {
      console.error(err)
      setError("Failed to load admin data.")
    } finally {
      setLoadingData(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    navigate("/login")
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleApproveTeacher = async (teacherId) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/approve-teacher/${teacherId}/`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData() // Refresh data after approval

      // Remove from pending and add to approved teachers
      const approvedTeacher = pendingTeachers.find((t) => t.id === teacherId)
      if (approvedTeacher) {
        setPendingTeachers((prev) => prev.filter((t) => t.id !== teacherId))
        setTeachers((prev) => [...prev, { ...approvedTeacher, is_verified: true }])
      }
    } catch (err) {
      console.error("Error approving teacher:", err)
      setError("Failed to approve teacher.")
    }
  }

  const handleRejectTeacher = async (teacherId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/admin/reject-teacher/${teacherId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacherId))
    } catch (err) {
      console.error("Error rejecting teacher:", err)
      setError("Failed to reject teacher.")
    }
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      await axios.delete(`http://127.0.0.1:8000/api/admin/users/${userToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (err) {
      console.error("Delete error:", err)
      setError("Failed to delete user.")
    }
  }

const filteredTeachers = teachers.filter(
  (teacher) =>
    teacher.email &&
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
)

const filteredStudents = students.filter(
  (student) =>
    student.email &&
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
)

  const filteredSessions = sessions.filter(
  (session) =>
    session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.teacher?.email?.toLowerCase().includes(searchTerm.toLowerCase())
)

  const filteredPendingTeachers = pendingTeachers.filter(
  (teacher) =>  
    teacher.email &&
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
)


  if (roleLoading || loadingData) {
    return (
      <div className="admin-page">
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
          <div className="floating-element element-4"></div>
          <div className="floating-element element-5"></div>
          <div className="floating-element element-6"></div>
          <div className="floating-element element-7"></div>
          <div className="floating-element element-8"></div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
          <div className="floating-element element-4"></div>
          <div className="floating-element element-5"></div>
          <div className="floating-element element-6"></div>
          <div className="floating-element element-7"></div>
          <div className="floating-element element-8"></div>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
        <div className="floating-element element-4"></div>
        <div className="floating-element element-5"></div>
        <div className="floating-element element-6"></div>
        <div className="floating-element element-7"></div>
        <div className="floating-element element-8"></div>
      </div>

      <div className="container-fluid">
        {/* Header Section */}
        <div className="admin-header">
          <div className="header-gradient">
            <div className="pattern-overlay"></div>
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-5">
                  <h1 className="admin-title">
                    <i className="fas fa-shield-alt me-3"></i>
                    Admin Dashboard
                  </h1>
                  <p className="admin-subtitle">Comprehensive Platform Management</p>
                </div>
                <div className="col-lg-4">
                  <div className="admin-stats">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-chalkboard-teacher"></i>
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{sessions.length}</div>
                        <div className="stat-label">Active Sessions</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-users"></i>
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{teachers.length + students.length}</div>
                        <div className="stat-label">Total Users</div>
                      </div>
                    </div>
                    {pendingTeachers.length > 0 && (
                      <div className="stat-card pending">
                        <div className="stat-icon">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                          <div className="stat-number">{pendingTeachers.length}</div>
                          <div className="stat-label">Pending Approvals</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-lg-3 text-end">
                  <div className="header-actions">
                    <div className="admin-info">
                      <span className="admin-role">Administrator</span>
                      <span className="admin-status">Online</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container">
          <div className="admin-content">
            {/* Search and Tabs */}
            <div className="admin-controls">
              <div className="row align-items-center mb-4">
                <div className="col-lg-6">
                  <div className="search-container">
                    <div className="search-box">
                      <i className="fas fa-search search-icon"></i>
                      <input
                        type="text"
                        placeholder="Search across all data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="admin-tabs">
                    <button
                      onClick={() => setActiveTab("sessions")}
                      className={`tab-btn ${activeTab === "sessions" ? "active" : ""}`}
                    >
                      <i className="fas fa-chalkboard-teacher me-2"></i>
                      Sessions
                    </button>
                    <button
                      onClick={() => setActiveTab("teachers")}
                      className={`tab-btn ${activeTab === "teachers" ? "active" : ""}`}
                    >
                      <i className="fas fa-user-tie me-2"></i>
                      Teachers
                    </button>
                    <button
                      onClick={() => setActiveTab("students")}
                      className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
                    >
                      <i className="fas fa-user-graduate me-2"></i>
                      Students
                    </button>
                    {pendingTeachers.length > 0 && (
                      <button
                        onClick={() => setActiveTab("pending")}
                        className={`tab-btn ${activeTab === "pending" ? "active" : ""} pending-tab`}
                      >
                        <i className="fas fa-clock me-2"></i>
                        Pending
                        <span className="pending-badge">{pendingTeachers.length}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            {activeTab === "sessions" && (
              <div className="content-section">
                <div className="section-header">
                  <div className="section-title">
                    <h3>
                      <i className="fas fa-chalkboard-teacher me-3"></i>
                      Sessions Management
                    </h3>
                    <span className="section-count">{filteredSessions.length} sessions</span>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-download me-2"></i>
                      Export
                    </button>
                  </div>
                </div>
                {filteredSessions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-inbox"></i>
                    </div>
                    <h4>No Sessions Found</h4>
                    <p>No sessions match your search criteria.</p>
                  </div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="header-cell">Session Information</div>
                      <div className="header-cell">Instructor</div>
                      <div className="header-cell">Tests & Activity</div>
                      <div className="header-cell">Actions</div>
                    </div>
                    <div className="table-body">
                      {filteredSessions.map((session) => (
                        <div key={session.id} className="table-row">
                          <div className="cell session-cell">
                            <div className="session-info">
                              <h4 className="session-title">{session.title}</h4>
                              <div className="session-meta">
                                <span className="session-id">
                                  <i className="fas fa-hashtag me-1"></i>
                                  {session.id}
                                </span>
                                <span className="session-date">
                                  <i className="fas fa-calendar me-1"></i>
                                  Created {new Date(session.created_at || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="cell teacher-cell">
                            <div className="teacher-info">
                              <div className="teacher-avatar">
                                <i className="fas fa-user-tie"></i>
                              </div>
                              <div className="teacher-details">
                                <span className="teacher-email">{session.teacher.email}</span>
                                <span className="teacher-status">Verified Instructor</span>
                              </div>
                            </div>
                          </div>
                          <div className="cell tests-cell">
                            <div className="tests-info">
                              <div className="test-count">
                                <i className="fas fa-clipboard-list me-2"></i>
                                <span className="count-number">{session.tests.length}</span>
                                <span className="count-label">Tests</span>
                              </div>
                              {session.tests.length > 0 && (
                                <div className="test-preview">
                                  {session.tests.slice(0, 2).map((test) => (
                                    <span key={test.id} className="test-tag">
                                      {test.title}
                                    </span>
                                  ))}
                                  {session.tests.length > 2 && (
                                    <span className="more-indicator">+{session.tests.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="cell actions-cell">
                            <div className="action-buttons">
                              <button className="action-btn view-btn" title="View Details">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="action-btn edit-btn" title="Edit Session">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="action-btn analytics-btn" title="View Analytics">
                                <i className="fas fa-chart-bar"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "teachers" && (
              <div className="content-section">
                <div className="section-header">
                  <div className="section-title">
                    <h3>
                      <i className="fas fa-user-tie me-3"></i>
                      Teachers Management
                    </h3>
                    <span className="section-count">{filteredTeachers.length} teachers</span>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-download me-2"></i>
                      Export
                    </button>
                  </div>
                </div>
                {filteredTeachers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-user-tie"></i>
                    </div>
                    <h4>No Teachers Found</h4>
                    <p>No teachers match your search criteria.</p>
                  </div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="header-cell">Teacher Information</div>
                      <div className="header-cell">Registration Date</div>
                      <div className="header-cell">Status</div>
                      <div className="header-cell">Actions</div>
                    </div>
                    <div className="table-body">
                      {filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="table-row">
                          <div className="cell user-cell">
                            <div className="user-info">
                              <div className="user-avatar teacher-avatar">
                                <i className="fas fa-user-tie"></i>
                              </div>
                              <div className="user-details">
                                <h4 className="user-email">{teacher.email}</h4>
                                <div className="user-meta">
                                  <span className="user-id">
                                    <i className="fas fa-hashtag me-1"></i>
                                    {teacher.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="cell date-cell">
                            <div className="date-info">
                              <span className="join-date">{new Date(teacher.date_joined).toLocaleDateString()}</span>
                              <span className="join-time">{new Date(teacher.date_joined).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="cell status-cell">
                            <span className="status-badge verified">
                              <i className="fas fa-check-circle me-1"></i>
                              Verified
                            </span>
                          </div>
                          <div className="cell actions-cell">
                            <div className="action-buttons">
                              <button className="action-btn view-btn" title="View Profile">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="action-btn edit-btn" title="Edit User">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(teacher)}
                                className="action-btn delete-btn"
                                title="Delete User"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="content-section">
                <div className="section-header">
                  <div className="section-title">
                    <h3>
                      <i className="fas fa-user-graduate me-3"></i>
                      Students Management
                    </h3>
                    <span className="section-count">{filteredStudents.length} students</span>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-download me-2"></i>
                      Export
                    </button>
                  </div>
                </div>
                {filteredStudents.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-user-graduate"></i>
                    </div>
                    <h4>No Students Found</h4>
                    <p>No students match your search criteria.</p>
                  </div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="header-cell">Student Information</div>
                      <div className="header-cell">Registration Date</div>
                      <div className="header-cell">Status</div>
                      <div className="header-cell">Actions</div>
                    </div>
                    <div className="table-body">
                      {filteredStudents.map((student) => (
                        <div key={student.id} className="table-row">
                          <div className="cell user-cell">
                            <div className="user-info">
                              <div className="user-avatar student-avatar">
                                <i className="fas fa-user-graduate"></i>
                              </div>
                              <div className="user-details">
                                <h4 className="user-email">{student.email}</h4>
                                <div className="user-meta">
                                  <span className="user-id">
                                    <i className="fas fa-hashtag me-1"></i>
                                    {student.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="cell date-cell">
                            <div className="date-info">
                              <span className="join-date">{new Date(student.date_joined).toLocaleDateString()}</span>
                              <span className="join-time">{new Date(student.date_joined).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="cell status-cell">
                            <span className="status-badge active">
                              <i className="fas fa-circle me-1"></i>
                              Active
                            </span>
                          </div>
                          <div className="cell actions-cell">
                            <div className="action-buttons">
                              <button className="action-btn view-btn" title="View Profile">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="action-btn edit-btn" title="Edit User">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student)}
                                className="action-btn delete-btn"
                                title="Delete User"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pending" && (
              <div className="content-section">
                <div className="section-header">
                  <div className="section-title">
                    <h3>
                      <i className="fas fa-clock me-3"></i>
                      Pending Teacher Approvals
                    </h3>
                    <span className="section-count">{filteredPendingTeachers.length} pending</span>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-download me-2"></i>
                      Export
                    </button>
                  </div>
                </div>
                {filteredPendingTeachers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <h4>No Pending Approvals</h4>
                    <p>All teacher registrations have been processed.</p>
                  </div>
                ) : (
                  <div className="data-table">
                    <div className="table-header">
                      <div className="header-cell">Teacher Information</div>
                      <div className="header-cell">Registration Date</div>
                      <div className="header-cell">Status</div>
                      <div className="header-cell">Actions</div>
                    </div>
                    <div className="table-body">
                      {filteredPendingTeachers.map((teacher) => (
                        <div key={teacher.id} className="table-row pending-row">
                          <div className="cell user-cell">
                            <div className="user-info">
                              <div className="user-avatar pending-avatar">
                                <i className="fas fa-user-clock"></i>
                              </div>
                              <div className="user-details">
                                <h4 className="user-email">{teacher.email}</h4>
                                <div className="user-meta">
                                  <span className="user-id">
                                    <i className="fas fa-hashtag me-1"></i>
                                    {teacher.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="cell date-cell">
                            <div className="date-info">
                              <span className="join-date">{new Date(teacher.date_joined).toLocaleDateString()}</span>
                              <span className="join-time">{new Date(teacher.date_joined).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="cell status-cell">
                            <span className="status-badge pending">
                              <i className="fas fa-clock me-1"></i>
                              Pending Review
                            </span>
                          </div>
                          <div className="cell actions-cell">
                            <div className="action-buttons">
                              <button
                                onClick={() => handleApproveTeacher(teacher.id)}
                                className="action-btn approve-btn"
                                title="Approve Teacher"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                onClick={() => handleRejectTeacher(teacher.id)}
                                className="action-btn reject-btn"
                                title="Reject Application"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                              <button className="action-btn view-btn" title="View Details">
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>
                <i className="fas fa-exclamation-triangle me-2"></i>
                Confirm User Deletion
              </h4>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete this user account?</p>
              <div className="user-preview">
                <div className="preview-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="preview-details">
                  <strong>{userToDelete?.email}</strong>
                  <span>ID: {userToDelete?.id}</span>
                </div>
              </div>
              <div className="warning-box">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <span>This action cannot be undone. All associated data will be permanently removed.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="btn btn-secondary"
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                <i className="fas fa-trash me-2"></i>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
