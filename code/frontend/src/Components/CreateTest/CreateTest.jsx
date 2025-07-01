import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Upload,
  FileText,
  Settings,
  Clock,
  Target,
  Edit3,
  Save,
  Check,
  AlertCircle,
  Loader,
  ArrowLeft,
  Sparkles,
  Brain,
  CheckCircle,
  X,
  Eye,
  RotateCcw,
} from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./create-test-styles.css"


function CreateTest() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token")

  const [timeLimit, setTimeLimit] = useState(30)
  const [formData, setFormData] = useState({
    promptText: "",
    difficulty: "medium",
    file: null,
    mcqCount: 5,
    qnaCount: 0,
  })
  const [testId, setTestId] = useState(null)
  const [testTitle, setTestTitle] = useState("")
  const [questions, setQuestions] = useState([])
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [loading, setLoading] = useState({
    creating: false,
    generating: false,
    saving: false,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentStep, setCurrentStep] = useState(1)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }))
    setError("")
  }

  const handleCreateTest = async () => {
    if (!testTitle) {
      setError("Please enter a test title before generating questions.")
      return null
    }

    setLoading((prev) => ({ ...prev, creating: true }))
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/create-test/${sessionId}/`,
        {
          title: testTitle,
          time_limit_minutes: timeLimit,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const newTestId = response.data.id
      setTestId(newTestId)
      setSuccess("Test created successfully!")
      return newTestId
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to create test"
      setError(errorMsg)
      console.error("Create test error:", err)
      return null
    } finally {
      setLoading((prev) => ({ ...prev, creating: false }))
    }
  }

  const handleGenerate = async () => {
    let currentTestId = testId
    if (!currentTestId) {
      currentTestId = await handleCreateTest()
      if (!currentTestId) return
    }

    if (!formData.promptText && !formData.file) {
      setSuccess("")
      setError("Please provide either text content or a file")
      return
    }

    setLoading((prev) => ({ ...prev, generating: true }))
    setError("")
    setSuccess("")
    setCurrentStep(3)

    const formDataToSend = new FormData()
    formDataToSend.append("prompt_text", formData.promptText)
    if (formData.file) {
      formDataToSend.append("file", formData.file)
    }
    formDataToSend.append("difficulty", formData.difficulty)
    formDataToSend.append("mode", "teacher")
    formDataToSend.append("test_id", currentTestId)
    formDataToSend.append("mcq_count", formData.mcqCount)
    formDataToSend.append("qna_count", formData.qnaCount)

    try {
      console.log("Sending request to backend...")
      const response = await axios.post("http://127.0.0.1:8000/generate-questions/", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Received response:", response)

      if (!response.data) throw new Error("Empty response from server")

      let questionsList = []

      if (Array.isArray(response.data.questions)) {
        questionsList = response.data.questions
      } else if (typeof response.data.questions === "string") {
        try {
          const jsonString = response.data.questions
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()
          questionsList = JSON.parse(jsonString)
        } catch (parseError) {
          console.error("Parse error:", parseError)
          throw new Error("Failed to parse questions")
        }
      }

      if (!questionsList || questionsList.length === 0) {
        throw new Error("No questions generated")
      }

      const formattedQuestions = questionsList.map((q, i) => ({
        id: q.id || `temp-${i}-${Date.now()}`,
        question_type: q.question_type || "MCQ",
        content: q.content || "No content provided",
        option_a: q.option_a || "",
        option_b: q.option_b || "",
        option_c: q.option_c || "",
        option_d: q.option_d || "",
        correct_option: q.correct_option || "A",
      }))

      console.log("Formatted questions:", formattedQuestions)
      setQuestions(formattedQuestions)
      setSuccess(`Successfully generated ${formattedQuestions.length} questions!`)
      setCurrentStep(4)
    } catch (error) {
      console.error("Generation error:", error)
      let errorMsg = "Failed to generate questions"

      if (error.response) {
        errorMsg =
          error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.message) {
        errorMsg = error.message
      }

      setSuccess("")
      setError(errorMsg)
      setCurrentStep(2)
    } finally {
      setLoading((prev) => ({ ...prev, generating: false }))
    }
  }

  const handleSaveQuiz = async () => {
    if (!testId) {
      setError("No test ID available for saving")
      return
    }

    setLoading((prev) => ({ ...prev, saving: true }))
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/save-quiz/",
        {
          questions: questions.map((q) => ({
            id: q.id || null,
            question_type: q.question_type,
            content: q.content,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
          })),
          test_id: testId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )

      if (response.status === 200) {
        setSuccess(response.data.message || "Quiz saved successfully!")
        setTimeout(() => {
          navigate(`/teacher/session/${sessionId}/tests`)
        }, 2000)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Failed to save quiz"
      setError(errorMsg)
      console.error("Save error:", error)
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleEditChange = (id, field, value) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === id) {
        return { ...q, [field]: value }
      }
      return q
    })
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  useEffect(() => {
    setQuestions([])
    setTestId(null)
  }, [testTitle])

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <div className="create-test-wrapper min-vh-100">
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
            <div className="test-header">
              <div className="container">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-3">
                      <button
                        onClick={() => navigate(`/teacher/session/${sessionId}/tests`)}
                        className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        Back to Session
                      </button>
                      <div>
                        <h1 className="test-title">Create New Test</h1>
                        <p className="test-subtitle">Generate AI-powered questions for your students</p>
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
                  {/* Alert Messages */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="alert alert-danger d-flex align-items-center mb-4"
                      >
                        <AlertCircle size={20} className="me-2" />
                        {error}
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="alert alert-success d-flex align-items-center mb-4"
                      >
                        <CheckCircle size={20} className="me-2" />
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 1: Test Configuration */}
                  {currentStep === 1 && (
                    <motion.div
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="step-card"
                    >
                      <div className="step-header">
                        <div className="step-icon">
                          <Settings size={24} />
                        </div>
                        <div>
                          <h2 className="step-title">Test Configuration</h2>
                          <p className="step-description">Set up your test details and parameters</p>
                        </div>
                      </div>

                      <div className="step-body">
                        <div className="row g-4">
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">
                                <BookOpen size={16} className="me-2" />
                                Test Title
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-lg"
                                value={testTitle}
                                onChange={(e) => setTestTitle(e.target.value)}
                                placeholder="Enter a descriptive title for your test"
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <Clock size={16} className="me-2" />
                                Time Limit (minutes)
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Math.max(1, e.target.value))}
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <Target size={16} className="me-2" />
                                Difficulty Level
                              </label>
                              <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="form-select"
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">Number of MCQs</label>
                              <input
                                type="number"
                                name="mcqCount"
                                min="0"
                                max="20"
                                value={formData.mcqCount}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">Number of Q&A Questions</label>
                              <input
                                type="number"
                                name="qnaCount"
                                min="0"
                                max="20"
                                value={formData.qnaCount}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="step-footer">
                        <button
                          onClick={() => setCurrentStep(2)}
                          disabled={!testTitle || (formData.mcqCount === 0 && formData.qnaCount === 0)}
                          className="btn btn-primary btn-lg d-flex align-items-center gap-2"
                        >
                          Continue to Content
                          <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Content Input */}
                  {currentStep === 2 && (
                    <motion.div
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="step-card"
                    >
                      <div className="step-header">
                        <div className="step-icon">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h2 className="step-title">Content Source</h2>
                          <p className="step-description">Provide content for AI question generation</p>
                        </div>
                      </div>

                      <div className="step-body">
                        <div className="row g-4">
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">
                                <FileText size={16} className="me-2" />
                                Text Content
                              </label>
                              <textarea
                                name="promptText"
                                rows="8"
                                className="form-control"
                                placeholder="Enter the content you want to generate questions from..."
                                value={formData.promptText}
                                onChange={handleChange}
                              />
                            </div>
                          </div>

                          <div className="col-12">
                            <div className="divider">
                              <span>OR</span>
                            </div>
                          </div>

                          <div className="col-12">
                            <div className="upload-area">
                              <input
                                type="file"
                                id="fileUpload"
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.txt"
                                className="d-none"
                              />
                              <label htmlFor="fileUpload" className="upload-label">
                                <div className="upload-content">
                                  <Upload size={48} className="upload-icon" />
                                  <h4>Upload a Document</h4>
                                  <p>Drag and drop or click to upload PDF, DOCX, or TXT files</p>
                                  {formData.file && (
                                    <div className="uploaded-file">
                                      <FileText size={16} />
                                      <span>{formData.file.name}</span>
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="step-footer">
                        <button onClick={() => setCurrentStep(1)} className="btn btn-outline-secondary">
                          <ArrowLeft size={16} className="me-2" />
                          Back
                        </button>
                        <button
                          onClick={handleGenerate}
                          disabled={loading.generating || (!formData.promptText && !formData.file)}
                          className="btn btn-primary btn-lg d-flex align-items-center gap-2"
                        >
                          {loading.generating ? (
                            <>
                              <Loader size={16} className="spinner" />
                              Generating Questions...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              Generate Questions
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Generation Progress */}
                  {currentStep === 3 && loading.generating && (
                    <motion.div
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="step-card text-center"
                    >
                      <div className="generation-progress">
                        <div className="generation-icon">
                          <Brain size={64} className="brain-icon" />
                        </div>
                        <h2>AI is Generating Questions</h2>
                        <p>Please wait while our AI analyzes your content and creates personalized questions...</p>
                        <div className="progress-dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Review Questions */}
                  {currentStep === 4 && questions.length > 0 && (
                    <motion.div
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="step-card"
                    >
                      <div className="step-header">
                        <div className="step-icon">
                          <Eye size={24} />
                        </div>
                        <div>
                          <h2 className="step-title">Review & Edit Questions</h2>
                          <p className="step-description">
                            Review the generated questions and make any necessary edits
                          </p>
                        </div>
                        <div className="questions-count">
                          <span className="count-badge">{questions.length} Questions</span>
                        </div>
                      </div>

                      <div className="questions-container">
                        {questions.map((q, index) => (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="question-card"
                          >
                            {editingQuestionId === q.id ? (
                              <div className="question-edit-mode">
                                <div className="question-edit-header">
                                  <h5>Editing Question {index + 1}</h5>
                                  <button
                                    onClick={() => setEditingQuestionId(null)}
                                    className="btn btn-sm btn-outline-secondary"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                <div className="form-group mb-3">
                                  <label className="form-label">Question</label>
                                  <textarea
                                    value={q.content}
                                    onChange={(e) => handleEditChange(q.id, "content", e.target.value)}
                                    className="form-control"
                                    rows="3"
                                  />
                                </div>

                                {q.question_type === "MCQ" && (
                                  <>
                                    <div className="row g-3 mb-3">
                                      {["a", "b", "c", "d"].map((opt) => (
                                        <div key={opt} className="col-md-6">
                                          <label className="form-label">Option {opt.toUpperCase()}</label>
                                          <input
                                            type="text"
                                            value={q[`option_${opt}`]}
                                            onChange={(e) => handleEditChange(q.id, `option_${opt}`, e.target.value)}
                                            className="form-control"
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="form-group mb-3">
                                      <label className="form-label">Correct Answer</label>
                                      <select
                                        value={q.correct_option}
                                        onChange={(e) => handleEditChange(q.id, "correct_option", e.target.value)}
                                        className="form-select"
                                      >
                                        {["A", "B", "C", "D"].map((opt) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </>
                                )}

                                <div className="question-edit-actions">
                                  <button
                                    onClick={() => setEditingQuestionId(null)}
                                    className="btn btn-success d-flex align-items-center gap-2"
                                  >
                                    <Check size={16} />
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="question-view-mode">
                                <div className="question-header">
                                  <div className="question-number">Q{index + 1}</div>
                                  <div className="question-type-badge">
                                    <span className={`badge ${q.question_type === "MCQ" ? "mcq" : "qna"}`}>
                                      {q.question_type}
                                    </span>
                                  </div>
                                  <div className="question-actions">
                                    <button
                                      onClick={() => setEditingQuestionId(q.id)}
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => removeQuestion(q.id)}
                                      className="btn btn-sm btn-outline-danger"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="question-content">
                                  <h5 className="question-text">{q.content}</h5>

                                  {q.question_type === "MCQ" ? (
                                    <div className="options-grid">
                                      {["a", "b", "c", "d"].map((opt) => {
                                        if (!q[`option_${opt}`]) return null
                                        const isCorrect = q.correct_option === opt.toUpperCase()
                                        return (
                                          <div key={opt} className={`option-item ${isCorrect ? "correct" : ""}`}>
                                            <div className="option-label">{opt.toUpperCase()}</div>
                                            <div className="option-text">{q[`option_${opt}`]}</div>
                                            {isCorrect && <Check size={16} className="correct-icon" />}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="qna-indicator">
                                      <FileText size={16} />
                                      <span>Written answer question</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      <div className="step-footer">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        >
                          <RotateCcw size={16} />
                          Generate New Questions
                        </button>
                        <button
                          onClick={handleSaveQuiz}
                          disabled={loading.saving}
                          className="btn btn-success btn-lg d-flex align-items-center gap-2"
                        >
                          {loading.saving ? (
                            <>
                              <Loader size={16} className="spinner" />
                              Saving Quiz...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Save Quiz
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
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

export default CreateTest
