import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./attempted-test-styles.css"
// import "../../global.css"


export default function AttemptedTests() {
  const [attempts, setAttempts] = useState([])
  const [filteredAttempts, setFilteredAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [sortBy, setSortBy] = useState("date")
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
        setFilteredAttempts(data)
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

  // Filter and search logic
  useEffect(() => {
    let filtered = [...attempts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (attempt) =>
          attempt.test_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attempt.session_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Performance filter
    if (filterBy !== "all") {
      filtered = filtered.filter((attempt) => {
        const score = typeof attempt.score === "number" ? attempt.score : 0
        switch (filterBy) {
          case "excellent":
            return score >= 90
          case "good":
            return score >= 70 && score < 90
          case "average":
            return score >= 50 && score < 70
          case "poor":
            return score < 50
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.score || 0) - (a.score || 0)
        case "title":
          return (a.test_title || "").localeCompare(b.test_title || "")
        case "date":
        default:
          return new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at)
      }
    })

    setFilteredAttempts(filtered)
  }, [attempts, searchTerm, filterBy, sortBy])

  const handleView = (attemptId) => {
    if (!attemptId) {
      console.error("Attempt ID is undefined")
      return
    }
    navigate(`/result-page/${attemptId}`)
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
    if (score >= 70) return "good"
    if (score >= 50) return "average"
    return "poor"
  }

  const getScoreIcon = (score) => {
    if (score >= 90) return "🏆"
    if (score >= 70) return "🎯"
    if (score >= 50) return "📈"
    return "📊"
  }

  const getPerformanceStats = () => {
    if (attempts.length === 0) return { total: 0, average: 0 }
    const total = attempts.length
    const average = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / total
    return { total, average: Math.round(average * 10) / 10 }
  }

  const stats = getPerformanceStats()

  if (loading) {
    return (
      <div className="attempted-tests-loading">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading Your Test History</h2>
          <p>Retrieving your attempted tests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="attempted-tests-error">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2>Something Went Wrong</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="attempted-tests-container">
      {/* Floating background elements */}
      <div className="floating-elements">
        <div className="float float-1"></div>
        <div className="float float-2"></div>
        <div className="float float-3"></div>
        <div className="float float-4"></div>
      </div>

      {/* Header */}
      <div className="attempted-tests-header">
        <div className="header-pattern"></div>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="page-title">Test History</h1>
              <p className="page-subtitle">Review your attempted tests and track your progress</p>
            </div>
            <div className="col-md-4">
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Tests Taken</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.average}%</div>
                    <div className="stat-label">Avg Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container">
        <div className="filters-section">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search tests or sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
                <div className="search-icon">🔍</div>
              </div>
            </div>
            <div className="col-md-4">
              <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="form-select">
                <option value="all">All Performance Levels</option>
                <option value="excellent">Excellent (90%+)</option>
                <option value="good">Good (70-89%)</option>
                <option value="average">Average (50-69%)</option>
                <option value="poor">Needs Improvement (&lt;50%)</option>
              </select>
            </div>
            <div className="col-md-4">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select">
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="tests-grid">
          {filteredAttempts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Tests Found</h3>
              <p>
                {searchTerm || filterBy !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You haven't attempted any tests yet"}
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredAttempts.map((attempt, index) => (
                <div key={attempt.id} className="col-lg-6 col-xl-4">
                  <div
                    className={`test-card ${getScoreColor(attempt.score || 0)}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="test-card-header">
                      <div className="test-info">
                        <h3 className="test-title">{attempt.test_title || "Untitled Test"}</h3>
                        <p className="session-name">{attempt.session_name || "Unknown Session"}</p>
                      </div>
                      <div className="score-badge">
                        <span className="score-icon">{getScoreIcon(attempt.score || 0)}</span>
                        <span className="score-value">{attempt.score || 0}%</span>
                      </div>
                    </div>

                    <div className="test-details">
                      <div className="detail-item">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">
                          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Questions:</span>
                        <span className="detail-value">{attempt.total_questions || "N/A"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Correct:</span>
                        <span className="detail-value">{attempt.correct_answers || "N/A"}</span>
                      </div>
                    </div>

                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${attempt.score || 0}%` }}></div>
                      </div>
                    </div>

                    <div className="test-actions">
                      <button onClick={() => handleView(attempt.id)} className="btn btn-view">
                        <span className="btn-icon">👁️</span>
                        View Results
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(attempt.id, attempt.test_title)}
                        className="btn btn-download"
                      >
                        <span className="btn-icon">📥</span>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
