import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserRole } from '../auth';

const QUESTION_TYPES = {
  MCQ: 'MCQ',
  QNA: 'QNA',
};

const AttemptTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const role = useUserRole();
  const token = localStorage.getItem('access_token');

  const [testDetails, setTestDetails] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [Submitting, setSubmitting] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `http://127.0.0.1:8000/student/attempt-test/${testId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (response?.data) {
          setTestDetails({
            title: response.data.title || 'Untitled Test',
            attemptId: response.data.attempt_id,
            timeLimit: response.data.time_limit_minutes,
          });
          setQuestions(response.data.questions || []);
          if (response.data.time_limit_minutes) {
            setTimeRemaining(response.data.time_limit_minutes * 60);
          }
        } else {
          throw new Error('Invalid server response');
        }
      } catch (err) {
        console.error('Fetch Test Error:', err);
        setError(err?.response?.data?.error || err.message || 'Failed to fetch test');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId, token]);

  useEffect(() => {
    if (timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleAutoSubmit = async () => {
    if (Object.keys(answers).length > 0) {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Prepare payload
      const payload = {
        attempt_id: testDetails.attemptId,
        answers: Object.entries(answers)
          .filter(([_, answer]) => answer !== undefined && answer !== '')
          .map(([questionId, answer]) => ({
            question_id: Number(questionId),
            answer: typeof answer === 'string' ? answer.trim() : answer
          }))
      };
  
      // Debug
      console.log('Submitting:', JSON.stringify(payload, null, 2));
  
      const response = await axios.post(
        `http://127.0.0.1:8000/student/submit-test/${testId}/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status < 500, // Don't throw on 400 errors
        }
      );
  
      if (response.data.success) {
        navigate(`/test-result/${response.data.attempt_id}`);
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
      
    } catch (error) {
      const serverError = error.response?.data?.error || 
                         error.response?.data?.detail ||
                         error.message;
      
      console.error('Submission failed:', {
        error: error.toString(),
        response: error.response?.data
      });
      
      alert(`Submission Error: ${serverError}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (role !== 'student') {
    return <div className="access-denied">Access restricted. Only students can attempt tests.</div>;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="test-container">
      <div className="test-header">
        <h1 className="test-title">{testDetails?.title}</h1>
        {timeRemaining !== null && (
          <div className="timer">
            Time Remaining: <span className="time">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      <div className="questions-list">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className={`question-card ${q.question_type === QUESTION_TYPES.QNA ? 'qna-type' : 'mcq-type'}`}
          >
            <div className="question-header">
              <span className="question-number">Q{index + 1}</span>
              <span className="question-marks">Marks: {q.marks || 1}</span>
              <span className="question-type-badge">
                {q.question_type === QUESTION_TYPES.QNA ? 'Written Answer' : 'MCQ'}
              </span>
            </div>

            <h3 className="question-content">{q.content}</h3>

            {q.question_type === QUESTION_TYPES.MCQ ? (
              <div className="mcq-options">
                {Object.entries(q.options)
                  .filter(([key]) => key !== 'correct') // Exclude the 'correct' key
                  .map(([key, value]) => (
                    <div key={key} className="mcq-option">
                      <input
                        type="radio"
                        id={`q-${q.id}-${key}`}
                        name={`q-${q.id}`}
                        value={key}
                        checked={answers[q.id] === key}
                        onChange={() => handleAnswerChange(q.id, key)}
                      />
                      <label htmlFor={`q-${q.id}-${key}`}>
                        <span className="option-letter">{key}.</span>
                        <span className="option-text">{value}</span>
                      </label>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="qna-answer">
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Type your detailed answer here..."
                  rows={5}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="test-footer">
        <button
          onClick={handleSubmit}
          className="submit-button"
          disabled={Object.keys(answers).length === 0}
        >
          Submit Test
        </button>
        <p className="answered-count">
          Answered: {Object.keys(answers).length}/{questions.length} questions
        </p>
      </div>

      {/* CSS Styles */}
      <style>{`
        .test-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
        .test-title { color: #2c3e50; margin: 0; }
        .timer { background: #34495e; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; }
        .timer .time { color: #f1c40f; font-family: monospace; }
        .questions-list { margin-bottom: 40px; }
        .question-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border-left: 4px solid #3498db; }
        .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
        .question-number { font-weight: bold; color: #3498db; }
        .question-marks { font-size: 0.9rem; color: #7f8c8d; }
        .question-type-badge { background: #e74c3c; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase; }
        .question-content { margin: 0 0 20px 0; color: #2c3e50; font-size: 1.1rem; line-height: 1.5; }
        .mcq-options { display: grid; gap: 12px; }
        .mcq-option { display: flex; align-items: center; padding: 10px; border-radius: 6px; transition: background 0.2s; }
        .mcq-option:hover { background: #f5f7fa; }
        .mcq-option input { margin-right: 12px; width: 18px; height: 18px; cursor: pointer; }
        .mcq-option label { display: flex; align-items: center; cursor: pointer; width: 100%; }
        .option-letter { font-weight: bold; margin-right: 8px; color: #3498db; min-width: 20px; }
        .option-text { flex: 1; }
        .qna-answer textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; resize: vertical; font-family: inherit; font-size: 1rem; line-height: 1.5; min-height: 120px; }
        .test-footer { text-align: center; }
        .submit-button { background: #27ae60; color: white; padding: 12px 25px; border: none; border-radius: 6px; font-size: 1rem; font-weight: bold; cursor: pointer; }
        .submit-button:disabled { background: #bdc3c7; cursor: not-allowed; }
        .answered-count { margin-top: 10px; font-size: 0.9rem; color: #7f8c8d; }
        .loading-container, .error-container { text-align: center; padding: 50px; }
        .loading-spinner { margin-bottom: 20px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AttemptTest;