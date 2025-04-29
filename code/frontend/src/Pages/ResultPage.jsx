import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserRole } from '../auth';

const ResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) navigate('/login');
    if (!roleLoading && role !== 'student') navigate('/login');
    if (!attemptId) navigate('/student-dashboard');

    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://127.0.0.1:8000/api/evaluate/test-result/${attemptId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );
    console.log(response.data);

        if (!response.data) throw new Error('No data received');
        setResults(response.data);
      } catch (err) {
        console.error('Error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        } else {
          setError(err.response?.data?.error || err.message || 'Failed to load results');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [attemptId, navigate, role, roleLoading]);

  const renderQuestionResult = (question) => {
    const studentAnswer = results?.student_answers?.[question.id];
    const isCorrect = results?.correct_answers_details?.[question.id]?.is_correct;
    
    return (
      <div key={question.id} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
        <div className="question-header">
          <h4>{question.content}</h4>
          <span className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
          <span>Marks: {question.marks}</span>
        </div>

        {question.question_type === 'MCQ' && (
          <div className="mcq-results">
            <div className="student-answer">
              <strong>Your answer:</strong> {studentAnswer || 'Not answered'}
            </div>
            <div className="correct-answer">
              <strong>Correct answer:</strong> {question.options?.correct}
            </div>
            {!isCorrect && (
              <div className="explanation">
                <strong>Explanation:</strong> {results.correct_answers_details?.[question.id]?.explanation}
              </div>
            )}
          </div>
        )}

        {question.question_type === 'QNA' && (
          <div className="qna-results">
            <div className="student-answer">
              <strong>Your answer:</strong> 
              <div className="answer-text">{studentAnswer || 'Not answered'}</div>
            </div>
            <div className="feedback">
              <strong>Feedback:</strong> 
              <div className="feedback-text">
                {results.correct_answers_details?.[question.id]?.feedback || 'No feedback provided'}
              </div>
            </div>
            <div className="marks-awarded">
              <strong>Marks awarded:</strong> {results.correct_answers_details?.[question.id]?.marks_awarded || 0}/{question.marks}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (roleLoading) return <div className="loading">Verifying access...</div>;
  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="result-container">
      <h2>Test Results</h2>
      
      <div className="result-summary">
        <h3>Score: {results?.score}%</h3>
        <p>Correct Answers: {results?.correct_answers}/{results?.total_questions}</p>
        <p className="test-date">
          Submitted on: {new Date(results?.submitted_at).toLocaleString()}
        </p>
      </div>

      <div className="detailed-results">
        <h3>Question Breakdown</h3>
        {results?.questions?.map(renderQuestionResult)}
      </div>

      {results?.suggested_topics?.length > 0 && (
        <div className="improvement-suggestions">
          <h3>Areas for Improvement</h3>
          <ul>
            {results.suggested_topics.map((topic, index) => (
              <li key={index}>
                <strong>{topic.topic}</strong>: {topic.reason}
                {topic.resources && (
                  <div className="resources">
                    Resources: {topic.resources.join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => navigate('/student-dashboard')} className="dashboard-button">
        Back to Dashboard
      </button>

      <style>{`
        .result-container {
          max-width: 900px;
          margin: 2rem auto;
          padding: 2rem;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .result-summary {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .question-result {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid;
        }
        
        .question-result.correct {
          background: #f0fff4;
          border-color: #38a169;
        }
        
        .question-result.incorrect {
          background: #fff5f5;
          border-color: #e53e3e;
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .result-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: bold;
        }
        
        .result-badge.correct {
          background: #c6f6d5;
          color: #22543d;
        }
        
        .result-badge.incorrect {
          background: #fed7d7;
          color: #742a2a;
        }
        
        .student-answer, .correct-answer, .feedback, .marks-awarded {
          margin: 0.5rem 0;
        }
        
        .answer-text, .feedback-text {
          background: #f7fafc;
          padding: 0.75rem;
          border-radius: 4px;
          margin-top: 0.5rem;
          border: 1px solid #e2e8f0;
        }
        
        .improvement-suggestions {
          background: #ebf8ff;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 2rem 0;
        }
        
        .improvement-suggestions li {
          margin-bottom: 1rem;
        }
        
        .resources {
          font-size: 0.9rem;
          color: #4a5568;
          margin-top: 0.25rem;
        }
        
        .dashboard-button {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 2rem auto 0;
          padding: 0.8rem;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ResultPage;