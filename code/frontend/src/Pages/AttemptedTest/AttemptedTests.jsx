import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./attempted-test-styles.css"

export default function AttemptedTests() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [filterBy, setFilterBy] = useState("all")
  const token = localStorage.getItem("access_token")
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    const fetchAttempts = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://127.0.0.1:8000/student/attempted-tests/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setAttempts(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching attempts:", err)
        setError(err.message || "Failed to load attempted tests")
      } finally {
        setLoading(false)
      }
    }

    fetchAttempts()
  }, [token, navigate])

  const handleView = (attemptId) => {
    if (!attemptId) {
      console.error("Attempt ID is undefined")
      return
    }
    navigate(`/student/attempted-tests/${attemptId}`)
  }

  const handleDownloadPDF = async (attemptId, testTitle) => {
    if (!attemptId) {
      console.error("Attempt ID is undefined for PDF download")
      return
    }

    if (!token) {
      console.error("No authentication token found")
      return
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/student/attempted-tests/${attemptId}/pdf/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${testTitle || "test"}_attempt_${attemptId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download PDF. Please try again.")
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return "excellent"
    if (score >= 80) return "good"
    if (score >= 70) return "average"
    if (score >= 60) return "below-average"
    return "poor"
  }

  const getScoreIcon = (score) => {
    if (score >= 90) return "🏆"
    if (score >= 80) return "🎯"
    if (score >= 70) return "📈"
    if (score >= 60) return "📊"
    return "📉"
  }

  const filteredAndSortedAttempts = attempts
    .filter((attempt) => {
      const matchesSearch =
        attempt.test_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.session_name?.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterBy === "all") return matchesSearch
      if (filterBy === "excellent") return matchesSearch && attempt.score >= 90
      if (filterBy === "good") return matchesSearch && attempt.score >= 70 && attempt.score < 90
      if (filterBy === "needs-improvement") return matchesSearch && attempt.score < 70

      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
      if (sortBy === "score") return (b.score || 0) - (a.score || 0)
      if (sortBy === "title") return (a.test_title || "").localeCompare(b.test_title || "")
      return 0
    })

  if (loading) {
    return (
      <div className="attempted-tests-page">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>

        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="loading-container">
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <h3>Loading Your Test History</h3>
                  <p>Fetching your attempted tests...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="attempted-tests-page">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>

        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="error-container">
                <div className="error-content">
                  <div className="error-icon">⚠️</div>
                  <h3>Error Loading Tests</h3>
                  <p>{error}</p>
                  <button onClick={() => window.location.reload()} className="btn btn-primary">
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="attempted-tests-page">
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>

      <div className="container-fluid">
        {/* Header Section */}
        <div className="row">
          <div className="col-12">
            <div className="page-header">
              <div className="header-gradient"></div>
              <div className="header-pattern"></div>
              <div className="header-content">
                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <div className="header-text">
                      <h1 className="page-title">
                        <i className="fas fa-history me-3"></i>
                        Test History
                      </h1>
                      <p className="page-subtitle">View and download your completed test attempts</p>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="header-stats">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="stat-card">
                            <div className="stat-number">{attempts.length}</div>
                            <div className="stat-label">Total Tests</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="stat-card">
                            <div className="stat-number">
                              {attempts.length > 0
                                ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
                                : 0}
                              %
                            </div>
                            <div className="stat-label">Avg Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="controls-card">
              <div className="row align-items-center g-3">
                <div className="col-lg-6">
                  <div className="search-container">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search tests or sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="filter-controls">
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="form-group">
                          <label className="form-label">Sort by</label>
                          <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="date">Latest First</option>
                            <option value="score">Highest Score</option>
                            <option value="title">Test Name</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-group">
                          <label className="form-label">Filter</label>
                          <select
                            className="form-select"
                            value={filterBy}
                            onChange={(e) => setFilterBy(e.target.value)}
                          >
                            <option value="all">All Tests</option>
                            <option value="excellent">Excellent (90%+)</option>
                            <option value="good">Good (70-89%)</option>
                            <option value="needs-improvement">Needs Improvement (&lt;70%)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="row">
          <div className="col-12">
            {filteredAndSortedAttempts.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-content">
                  <div className="empty-icon">📝</div>
                  <h3>No Tests Found</h3>
                  <p>
                    {searchTerm || filterBy !== "all"
                      ? "No tests match your current search or filter criteria."
                      : "You haven't attempted any tests yet. Start practicing to see your results here!"}
                  </p>
                  {(searchTerm || filterBy !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setFilterBy("all")
                      }}
                      className="btn btn-primary"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="tests-grid">
                <div className="row g-4">
                  {filteredAndSortedAttempts.map((attempt, index) => (
                    <div key={attempt.id} className="col-lg-6 col-xl-4">
                      <div className={`test-card ${getScoreColor(attempt.score || 0)}`}>
                        <div className="card-header">
                          <div className="test-info">
                            <h5 className="test-title">{attempt.test_title || "Untitled Test"}</h5>
                            <p className="session-name">
                              <i className="fas fa-graduation-cap me-2"></i>
                              {attempt.session_name || "Unknown session"}
                            </p>
                          </div>
                          <div className="score-badge">
                            <span className="score-icon">{getScoreIcon(attempt.score || 0)}</span>
                            <span className="score-value">
                              {typeof attempt.score === "number" ? `${attempt.score}%` : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="card-body">
                          <div className="test-details">
                            <div className="detail-item">
                              <i className="fas fa-calendar-alt"></i>
                              <span>
                                {attempt.submitted_at
                                  ? new Date(attempt.submitted_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Date not available"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <i className="fas fa-question-circle"></i>
                              <span>{attempt.total_questions || "N/A"} questions</span>
                            </div>
                            <div className="detail-item">
                              <i className="fas fa-check-circle"></i>
                              <span>{attempt.correct_answers || "N/A"} correct</span>
                            </div>
                          </div>

                          <div className="progress-container">
                            <div className="progress">
                              <div className="progress-bar" style={{ width: `${attempt.score || 0}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="card-footer">
                          <div className="row g-2">
                            <div className="col-6">
                              <button onClick={() => handleView(attempt.id)} className="btn btn-primary w-100">
                                <i className="fas fa-eye me-2"></i>
                                View
                              </button>
                            </div>
                            <div className="col-6">
                              <button
                                onClick={() => handleDownloadPDF(attempt.id, attempt.test_title)}
                                className="btn btn-success w-100"
                              >
                                <i className="fas fa-download me-2"></i>
                                PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
