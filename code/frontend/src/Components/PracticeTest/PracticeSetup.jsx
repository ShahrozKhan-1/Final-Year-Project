import { useState, useRef } from "react"
import axios from "axios"
import {
  BookOpen,
  Upload,
  CheckCircle,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Brain,
  FileText,
  Settings,
  Award,
  Lightbulb,
  RefreshCw,
  Clock,
  AlertTriangle,
  BarChart2,
  Play,
  Target,
  Zap,
  Download,
  Sparkles,
  Eye,
} from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./practice-test-styles.css"
// import "../../global.css"


const PracticeTest = () => {
  const [topic, setTopic] = useState("")
  const [file, setFile] = useState(null)
  const [mcqCount, setMcqCount] = useState(2)
  const [qnaCount, setQnaCount] = useState(2)
  const [difficulty, setDifficulty] = useState("easy")
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const fileInputRef = useRef(null)

  const token = localStorage.getItem("access_token")

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setCurrentStep(2)
    const formData = new FormData()

    if (!token) {
      alert("You must be logged in to generate questions.")
      setLoading(false)
      setCurrentStep(1)
      return
    }

    if (topic) formData.append("prompt_text", topic)
    if (file) formData.append("file", file)
    formData.append("mcq_count", Number.parseInt(mcqCount))
    formData.append("qna_count", Number.parseInt(qnaCount))
    formData.append("difficulty", difficulty)

    try {
      const res = await axios.post("http://127.0.0.1:8000/practice/generate-questions/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setQuestions(res.data.questions || [])
      setAnswers({})
      setResult(null)
      setSubmitted(false)
      setCurrentStep(3)
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message)
      alert("Something went wrong while generating questions.")
      setCurrentStep(1)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    const payload = {
      questions: questions.map((q, index) => ({
        ...q,
        question_type: q.option_a ? "MCQ" : "QNA",
        student_answer: answers[index] || "",
        correct_answer: q.answer || q.correct_option,
        content: q.question || q.content,
      })),
    }

    try {
      const res = await axios.post("http://127.0.0.1:8000/practice/check/", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setResult(res.data)
      setSubmitted(true)
      setCurrentStep(4)
    } catch (error) {
      console.error("Error submitting answers:", error)
      alert("Failed to submit answers.")
    } finally {
      setLoading(false)
    }
  }

  const resetTest = () => {
    setQuestions([])
    setAnswers({})
    setResult(null)
    setSubmitted(false)
    setTopic("")
    setFile(null)
    setCurrentStep(1)
  }

  const getDifficultyConfig = (diff) => {
    switch (diff) {
      case "easy":
        return { color: "text-success", bg: "bg-success-soft", icon: CheckCircle }
      case "medium":
        return { color: "text-warning", bg: "bg-warning-soft", icon: Clock }
      case "hard":
        return { color: "text-danger", bg: "bg-danger-soft", icon: AlertTriangle }
      default:
        return { color: "text-primary", bg: "bg-primary-soft", icon: Settings }
    }
  }

  const getCorrectAnswers = () => {
    if (!result || !result.results) return 0
    return result.results.filter((item) => item.is_correct).length
  }

  const getTotalQuestions = () => questions.length

  const getScorePercentage = () => {
    if (!result || !result.results || !result.results.length) return 0
    return Math.round((getCorrectAnswers() / getTotalQuestions()) * 100)
  }

  const difficultyConfig = getDifficultyConfig(difficulty)
  const DifficultyIcon = difficultyConfig.icon

  return (
    <div className="practice-test-wrapper min-vh-100">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`floating-element floating-element-${i + 1}`} />
        ))}
      </div>

      <div className="container-fluid">
        <div className="row">
          {/* Header */}
          <div className="col-12 px-0">
            <div className="practice-header">
              <div className="container">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-3">
                      <div className="header-icon">
                        <Brain size={32} />
                      </div>
                      <div>
                        <h1 className="practice-title">AI Practice Test Generator</h1>
                        <p className="practice-subtitle">
                          Transform your study materials into personalized practice tests with instant AI feedback
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="step-indicator">
                      <span className="step-text">Step {currentStep} of 4</span>
                      <div className="step-progress">
                        <div className="step-progress-bar" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="main-content p-4">
              <div className="row justify-content-center">
                <div className="col-lg-10 col-xl-8">
                  {/* Step 1: Configuration */}
                  {currentStep === 1 && (
                    <div className="step-card">
                      <div className="step-header">
                        <div className="step-icon">
                          <Settings size={24} />
                        </div>
                        <div>
                          <h2 className="step-title">Practice Test Configuration</h2>
                          <p className="step-description">Set up your personalized learning experience</p>
                        </div>
                      </div>

                      <div className="step-body">
                        <div className="row g-4">
                          {/* Topic Input */}
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">
                                <BookOpen size={16} className="me-2" />
                                Topic or Subject
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-lg"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Enter your study topic (e.g., 'Machine Learning', 'World History')"
                              />
                            </div>
                          </div>

                          {/* File Upload */}
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">
                                <Upload size={16} className="me-2" />
                                Upload Study Material
                                <span className="text-muted ms-2">(Optional)</span>
                              </label>
                              <div
                                className={`upload-area ${dragActive ? "drag-active" : ""} ${file ? "file-uploaded" : ""}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="d-none" />
                                <label className="upload-label">
                                  <div className="upload-content">
                                    {file ? (
                                      <>
                                        <CheckCircle className="upload-icon text-success" size={48} />
                                        <h4 className="text-success">File Uploaded Successfully!</h4>
                                        <p className="text-muted">{file.name}</p>
                                        <div className="uploaded-file">
                                          <FileText size={16} />
                                          <span>Ready to process</span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="upload-icon" size={48} />
                                        <h4>Drag & Drop Your Files</h4>
                                        <p>or click to browse and upload</p>
                                        <small className="text-muted">PDF, DOCX, TXT files up to 10MB</small>
                                      </>
                                    )}
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Configuration Grid */}
                          <div className="col-md-4">
                            <div className="form-group">
                              <label className="form-label">
                                <FileText size={16} className="me-2" />
                                Multiple Choice Questions
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={mcqCount}
                                onChange={(e) => setMcqCount(Number(e.target.value))}
                                className="form-control text-center"
                              />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="form-group">
                              <label className="form-label">
                                <FileText size={16} className="me-2" />
                                Open-Ended Questions
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={qnaCount}
                                onChange={(e) => setQnaCount(Number(e.target.value))}
                                className="form-control text-center"
                              />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="form-group">
                              <label className="form-label">
                                <DifficultyIcon size={16} className={`me-2 ${difficultyConfig.color}`} />
                                Difficulty Level
                              </label>
                              <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="form-select"
                              >
                                <option value="easy">Easy - Beginner Level</option>
                                <option value="medium">Medium - Intermediate</option>
                                <option value="hard">Hard - Advanced</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="step-footer">
                        <div className="d-flex justify-content-end">
                          <button
                            onClick={handleGenerate}
                            disabled={loading || (!topic && !file)}
                            className="btn btn-primary btn-lg d-flex align-items-center gap-2"
                          >
                            <Zap size={16} />
                            Generate Practice Test
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Generation Progress */}
                  {currentStep === 2 && loading && (
                    <div className="step-card text-center">
                      <div className="generation-progress">
                        <div className="generation-icon">
                          <Brain size={64} className="brain-icon" />
                        </div>
                        <h2>AI is Generating Your Practice Test</h2>
                        <p>
                          Please wait while our advanced AI analyzes your content and creates personalized questions
                          tailored to your learning needs...
                        </p>
                        <div className="progress-dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Take Test */}
                  {currentStep === 3 && questions.length > 0 && !submitted && (
                    <div className="step-card">
                      <div className="step-header">
                        <div className="step-icon">
                          <Play size={24} />
                        </div>
                        <div>
                          <h2 className="step-title">Your Practice Test</h2>
                          <p className="step-description">Answer all questions to receive detailed feedback</p>
                        </div>
                        <div className="questions-count">
                          <span className="count-badge">{questions.length} Questions</span>
                        </div>
                      </div>

                      <div className="step-body">
                        {/* Test Info Cards */}
                        <div className="row g-3 mb-4">
                          <div className="col-md-4">
                            <div className="info-card bg-primary-soft">
                              <div className="info-icon text-primary">
                                <FileText size={20} />
                              </div>
                              <div className="info-content">
                                <div className="info-number">{questions.length}</div>
                                <div className="info-label">Total Questions</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="info-card bg-success-soft">
                              <div className="info-icon text-success">
                                <CheckCircle size={20} />
                              </div>
                              <div className="info-content">
                                <div className="info-number">{mcqCount}</div>
                                <div className="info-label">Multiple Choice</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="info-card bg-warning-soft">
                              <div className="info-icon text-warning">
                                <FileText size={20} />
                              </div>
                              <div className="info-content">
                                <div className="info-number">{qnaCount}</div>
                                <div className="info-label">Open-Ended</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Questions Container */}
                        <div className="questions-container">
                          {questions.map((q, idx) => (
                            <div key={idx} className="question-card">
                              <div className="question-header">
                                <div className="question-number">Q{idx + 1}</div>
                                <div className="question-type-badge">
                                  <span className={`badge ${q.option_a ? "mcq" : "qna"}`}>
                                    {q.option_a ? "MCQ" : "Q&A"}
                                  </span>
                                </div>
                              </div>

                              <div className="question-content">
                                <h5 className="question-text">{q.question || q.content}</h5>

                                {q.option_a ? (
                                  <div className="options-grid">
                                    {["a", "b", "c", "d"].map((opt) => {
                                      const key = `option_${opt}`
                                      if (!q[key]) return null
                                      return (
                                        <label
                                          key={opt}
                                          className={`option-item ${answers[idx] === opt ? "selected" : ""}`}
                                        >
                                          <input
                                            type="radio"
                                            name={`question-${idx}`}
                                            value={opt}
                                            checked={answers[idx] === opt}
                                            onChange={() => handleAnswerChange(idx, opt)}
                                            className="d-none"
                                          />
                                          <div className="option-label">{opt.toUpperCase()}</div>
                                          <div className="option-text">{q[key]}</div>
                                        </label>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="qna-input">
                                    <textarea
                                      rows={4}
                                      value={answers[idx] || ""}
                                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                      className="form-control"
                                      placeholder="Write your detailed answer here..."
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="step-footer">
                        <div className="d-flex justify-content-between align-items-center">
                          <button onClick={resetTest} className="btn btn-outline-secondary">
                            <ArrowLeft size={16} className="me-2" />
                            Start Over
                          </button>

                          <div className="progress-info">
                            <span className="text-muted">
                              Progress: {Object.keys(answers).length} of {questions.length} completed
                            </span>
                            <div className="progress mt-2" style={{ width: "200px" }}>
                              <div
                                className="progress-bar"
                                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <button
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length !== questions.length || loading}
                            className="btn btn-success btn-lg d-flex align-items-center gap-2"
                          >
                            {loading ? (
                              <>
                                <RefreshCw size={16} className="spinner" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} />
                                Submit Test
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Results */}
                  {currentStep === 4 && submitted && result && (
                    <div className="step-card">
                      <div className="step-header">
                        <div className="step-icon">
                          <Award size={24} />
                        </div>
                        <div>
                          <h2 className="step-title">Test Results</h2>
                          <p className="step-description">Your performance analysis and feedback</p>
                        </div>
                      </div>

                      <div className="step-body">
                        {/* Score Summary */}
                        <div className="results-summary mb-5">
                          <div className="row g-4">
                            <div className="col-md-3">
                              <div className="score-card bg-primary-soft">
                                <div className="score-icon text-primary">
                                  <BarChart2 size={24} />
                                </div>
                                <div className="score-value">{getScorePercentage()}%</div>
                                <div className="score-label">Overall Score</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="score-card bg-success-soft">
                                <div className="score-icon text-success">
                                  <CheckCircle size={24} />
                                </div>
                                <div className="score-value">{getCorrectAnswers()}</div>
                                <div className="score-label">Correct Answers</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="score-card bg-danger-soft">
                                <div className="score-icon text-danger">
                                  <XCircle size={24} />
                                </div>
                                <div className="score-value">{getTotalQuestions() - getCorrectAnswers()}</div>
                                <div className="score-label">Incorrect</div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className={`score-card ${difficultyConfig.bg}`}>
                                <div className={`score-icon ${difficultyConfig.color}`}>
                                  <DifficultyIcon size={24} />
                                </div>
                                <div className="score-value capitalize">{difficulty}</div>
                                <div className="score-label">Difficulty</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Feedback */}
                        <div className="feedback-card mb-4">
                          <div className="feedback-header">
                            <Lightbulb size={20} className="text-warning" />
                            <h5>AI Feedback</h5>
                          </div>
                          <div className="feedback-content">
                            <p>{result.overall_feedback}</p>
                          </div>
                        </div>

                        {/* Detailed Results */}
                        <div className="detailed-results">
                          <h5 className="mb-3">
                            <Eye size={20} className="me-2" />
                            Question Analysis
                          </h5>
                          {result.results.map((item, index) => (
                            <div key={index} className={`result-card ${item.is_correct ? "correct" : "incorrect"}`}>
                              <div className="result-header">
                                <span className="result-number">Q{index + 1}</span>
                                <span className={`result-status ${item.is_correct ? "correct" : "incorrect"}`}>
                                  {item.is_correct ? (
                                    <>
                                      <CheckCircle size={16} />
                                      Correct
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={16} />
                                      Incorrect
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="result-content">
                                <p className="question-text">{item.question}</p>

                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <div className="answer-box your-answer">
                                      <label>Your Answer:</label>
                                      <p>{item.student_answer}</p>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="answer-box correct-answer">
                                      <label>Correct Answer:</label>
                                      <p>{item.correct_answer || item.correct_option}</p>
                                    </div>
                                  </div>
                                </div>

                                {item.feedback && (
                                  <div className="feedback-box">
                                    <label>
                                      <Lightbulb size={14} className="me-1" />
                                      Feedback:
                                    </label>
                                    <p>{item.feedback}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Improvement Suggestions */}
                        {result.suggested_topics && result.suggested_topics.length > 0 && (
                          <div className="improvement-section mt-4">
                            <h5 className="mb-3">
                              <Target size={20} className="me-2" />
                              Suggested Areas for Improvement
                            </h5>
                            <div className="row g-2">
                              {result.suggested_topics.map((topic, i) => (
                                <div key={i} className="col-md-6">
                                  <div className="improvement-item">
                                    <ChevronRight size={16} className="text-primary" />
                                    <span>{topic}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="step-footer">
                        <div className="d-flex gap-3">
                          <button onClick={resetTest} className="btn btn-primary flex-fill">
                            <RefreshCw size={16} className="me-2" />
                            Create New Test
                          </button>
                          <button className="btn btn-success flex-fill">
                            <Download size={16} className="me-2" />
                            Download Results
                          </button>
                        </div>
                      </div>
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

export default PracticeTest
