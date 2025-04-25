import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function CreateTest() {
  const { sessionId } = useParams();
  const token = localStorage.getItem("access_token");

  const [timeLimit, setTimeLimit] = useState(30);
  const [formData, setFormData] = useState({
    promptText: "",
    difficulty: "medium",
    file: null,
    mcqCount: 5,
    qnaCount: 0
  });
  const [testId, setTestId] = useState(null);
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [loading, setLoading] = useState({
    creating: false,
    generating: false,
    saving: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    setError("");
  };

  const handleCreateTest = async () => {
    if (!testTitle) {
      setError("Please enter a test title before generating questions.");
      return null;
    }
  
    setLoading(prev => ({ ...prev, creating: true }));
    setError("");
    setSuccess("");

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
        }
      );
      
      const newTestId = response.data.id;
      setTestId(newTestId);
      setSuccess("Test created successfully!");
      return newTestId;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to create test";
      setError(errorMsg);
      console.error("Create test error:", err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const handleGenerate = async () => {
    let currentTestId = testId;
    if (!currentTestId) {
      currentTestId = await handleCreateTest();
      if (!currentTestId) return;
    }
  
    if (!formData.promptText && !formData.file) {
      setError("Please provide either text content or a file");
      return;
    }
  
    setLoading({ ...loading, generating: true });
    setError("");
    setSuccess("");
  
    const formDataToSend = new FormData();
    formDataToSend.append("prompt_text", formData.promptText);
    if (formData.file) {
      formDataToSend.append("file", formData.file);
    }
    formDataToSend.append("difficulty", formData.difficulty);
    formDataToSend.append("mode", "teacher");
    formDataToSend.append("test_id", currentTestId);
    formDataToSend.append("mcq_count", formData.mcqCount);
    formDataToSend.append("qna_count", formData.qnaCount);
  
    try {
      console.log("Sending request to backend..."); // Debug log
      const response = await axios.post(
        "http://127.0.0.1:8000/generate-questions/", 
        formDataToSend, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000 // 30 second timeout
        }
      );
  
      console.log("Received response:", response); // Debug log
  
      if (!response.data) {
        throw new Error("Empty response from server");
      }
  
      let questionsList = [];
      
      // Handle both array and string responses
      if (Array.isArray(response.data.questions)) {
        questionsList = response.data.questions;
      } else if (response.data.questions && typeof response.data.questions === 'string') {
        try {
          const jsonString = response.data.questions
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          questionsList = JSON.parse(jsonString);
        } catch (parseError) {
          console.error("Parse error:", parseError);
          throw new Error("Failed to parse questions");
        }
      }
  
      // Ensure we have valid questions
      if (!questionsList || questionsList.length === 0) {
        throw new Error("No questions generated");
      }
  
      const formattedQuestions = questionsList.map((q, i) => ({
        id: q.id || `temp-${i}-${Date.now()}`, // Ensure unique IDs
        question_type: q.question_type || 'MCQ',
        content: q.content || 'No content provided',
        option_a: q.option_a || '',
        option_b: q.option_b || '',
        option_c: q.option_c || '',
        option_d: q.option_d || '', 
        correct_option: q.correct_option || 'A'
      }));
  
      console.log("Formatted questions:", formattedQuestions); // Debug log
      setQuestions(formattedQuestions);
      setSuccess(`Successfully generated ${formattedQuestions.length} questions!`);
    } catch (error) {
      console.error("Generation error:", error);
      let errorMsg = "Failed to generate questions";
      
      if (error.response) {
        // Handle HTTP errors
        errorMsg = error.response.data?.error || 
                  error.response.data?.message || 
                  `Server error: ${error.response.status}`;
      } else if (error.message) {
        // Handle other errors
        errorMsg = error.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading({ ...loading, generating: false });
    }
  };

  const handleSaveQuiz = async () => {
    if (!testId) {
      setError("No test ID available for saving");
      return;
    }
  
    setLoading(prev => ({ ...prev, saving: true }));
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/save-quiz/",
        { 
          questions: questions.map(q => ({
            id: q.id || null,
            question_type: q.question_type,
            content: q.content,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option
          })),
          test_id: testId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000
        }
      );
      
      if (response.status === 200) {
        setSuccess(response.data.message || "Quiz saved successfully!");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                     error.message || 
                     "Failed to save quiz";
      setError(errorMsg);
      console.error("Save error:", error);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleEditChange = (id, field, value) => {
    const updatedQuestions = questions.map(q => {
      if (q.id === id) {
        return { ...q, [field]: value };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  useEffect(() => {
    setQuestions([]);
    setTestId(null); // Reset the test ID to ensure fresh test
  }, [testTitle]);


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Create Test</h2>

      {error && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#ff4444',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#00C851',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Test Title:
        </label>
        <input
          type="text"
          value={testTitle}
          onChange={(e) => setTestTitle(e.target.value)}
          placeholder="Enter test title"
          style={{ 
            padding: '10px', 
            width: '100%',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Content Source:
        </label>
        <textarea
          name="promptText"
          rows="6"
          style={{ 
            width: '100%', 
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          placeholder="Enter content here or upload a file below"
          value={formData.promptText}
          onChange={handleChange}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Upload file (PDF, DOCX, or TXT):
        </label>
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          style={{
            padding: '5px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '15px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Difficulty Level:
          </label>
          <select 
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            style={{ 
              padding: '10px',
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Time Limit (minutes):
          </label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Math.max(1, e.target.value))}
            min="1"
            style={{ 
              padding: '10px',
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Number of MCQs:
          </label>
          <input
            type="number"
            name="mcqCount"
            min="0"
            max="20"
            value={formData.mcqCount}
            onChange={handleChange}
            style={{ 
              padding: '10px',
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Number of Q&A Questions:
          </label>
          <input
            type="number"
            name="qnaCount"
            min="0"
            max="20"
            value={formData.qnaCount}
            onChange={handleChange}
            style={{ 
              padding: '10px',
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button 
          onClick={handleGenerate}
          disabled={loading.generating || (formData.mcqCount === 0 && formData.qnaCount === 0)}
          style={{
            padding: '12px 20px',
            background: loading.generating ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            flex: 1
          }}
        >
          {loading.generating ? (
            <span>Generating Questions...</span>
          ) : (
            <span>Generate Questions</span>
          )}
        </button>

        {questions.length > 0 && (
          <button 
            onClick={handleSaveQuiz}
            disabled={loading.saving}
            style={{
              padding: '12px 20px',
              background: loading.saving ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              flex: 1
            }}
          >
            {loading.saving ? (
              <span>Saving...</span>
            ) : (
              <span>Save All Questions</span>
            )}
          </button>
        )}
      </div>

      {questions.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Generated Questions ({questions.length})
          </h3>
          {questions.map((q) => (
            <div 
              key={q.id} 
              style={{ 
                marginBottom: '20px', 
                padding: '20px', 
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {editingQuestionId === q.id ? (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Question:
                    </label>
                    <textarea
                      value={q.content}
                      onChange={(e) => handleEditChange(q.id, 'content', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minHeight: '80px'
                      }}
                    />
                  </div>

                  {q.question_type === 'MCQ' && (
                    <>
                      {['a', 'b', 'c', 'd'].map((opt) => (
                        <div key={opt} style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '5px' }}>
                            Option {opt.toUpperCase()}:
                          </label>
                          <input
                            type="text"
                            value={q[`option_${opt}`]}
                            onChange={(e) => handleEditChange(q.id, `option_${opt}`, e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                          Correct Answer:
                        </label>
                        <select
                          value={q.correct_option}
                          onChange={(e) => handleEditChange(q.id, 'correct_option', e.target.value)}
                          style={{ 
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                      onClick={() => setEditingQuestionId(null)}
                      style={{
                        padding: '8px 16px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      {q.content}
                    </h4>
                    <span style={{
                      padding: '4px 8px',
                      background: q.question_type === 'MCQ' ? '#17a2b8' : '#6c757d',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {q.question_type}
                    </span>
                  </div>

                  {q.question_type === 'MCQ' ? (
                    <div style={{ marginTop: '15px' }}>
                      <ul style={{ 
                        listStyleType: 'none', 
                        paddingLeft: 0,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px'
                      }}>
                        {q.option_a && (
                          <li style={{ 
                            padding: '8px',
                            background: q.correct_option === 'A' ? '#d4edda' : '#f8f9fa',
                            border: q.correct_option === 'A' ? '1px solid #c3e6cb' : '1px solid #ddd',
                            borderRadius: '4px'
                          }}>
                            <strong>A:</strong> {q.option_a}
                          </li>
                        )}
                        {q.option_b && (
                          <li style={{ 
                            padding: '8px',
                            background: q.correct_option === 'B' ? '#d4edda' : '#f8f9fa',
                            border: q.correct_option === 'B' ? '1px solid #c3e6cb' : '1px solid #ddd',
                            borderRadius: '4px'
                          }}>
                            <strong>B:</strong> {q.option_b}
                          </li>
                        )}
                        {q.option_c && (
                          <li style={{ 
                            padding: '8px',
                            background: q.correct_option === 'C' ? '#d4edda' : '#f8f9fa',
                            border: q.correct_option === 'C' ? '1px solid #c3e6cb' : '1px solid #ddd',
                            borderRadius: '4px'
                          }}>
                            <strong>C:</strong> {q.option_c}
                          </li>
                        )}
                        {q.option_d && (
                          <li style={{ 
                            padding: '8px',
                            background: q.correct_option === 'D' ? '#d4edda' : '#f8f9fa',
                            border: q.correct_option === 'D' ? '1px solid #c3e6cb' : '1px solid #ddd',
                            borderRadius: '4px'
                          }}>
                            <strong>D:</strong> {q.option_d}
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '10px',
                      padding: '10px',
                      background: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <em>Written answer question</em>
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                    <button 
                      onClick={() => setEditingQuestionId(q.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CreateTest;