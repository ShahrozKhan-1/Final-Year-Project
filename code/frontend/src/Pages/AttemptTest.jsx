import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const QUESTION_TYPES = {
  MCQ: 'MCQ',
  QNA: 'QNA'
};

const AttemptTest = () => {
  const { testId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/student/attempt-test/${testId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const formattedQuestions = response.data.questions.map(q => ({
          ...q,
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          question_type: q.question_type
        }));
        
        setQuestions(formattedQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [testId, token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        answers: answers // e.g., { "12": "A", "13": "This is a written answer" }
      };
  
      const response = await axios.post(
        `http://127.0.0.1:8000/student/submit-test/${testId}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      alert('Test submitted successfully!');
      console.log(response.data);
    } catch (error) {
      if (error.response) {
        console.error('Server responded with:', error.response.data); // This is the key part
        alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error('Error submitting test:', error.message);
        alert('There was an error submitting your test. Please try again.');
      }
    }
  };
  
  
  

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="test-container">
      <h1 className="test-title">Test Questions</h1>
      
      <div className="questions-list">
        {questions.map((q, index) => (
          <div key={q.id} className={`question-card ${q.question_type === QUESTION_TYPES.QNA ? 'qna-type' : 'mcq-type'}`}>
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              <span className="question-type-badge">
                {q.question_type === QUESTION_TYPES.QNA ? 'Written Answer' : 'Multiple Choice'}
              </span>
            </div>
            
            <h3 className="question-content">{q.content}</h3>
            
            {q.question_type === QUESTION_TYPES.MCQ && (
              <div className="mcq-options">
                {['a', 'b', 'c', 'd'].filter(opt => q[`option_${opt}`]).map(opt => (
                  <div key={opt} className="mcq-option">
                    <input
                      type="radio"
                      id={`q-${q.id}-${opt}`}
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleAnswerChange(q.id, opt)}
                    />
                    <label htmlFor={`q-${q.id}-${opt}`}>
                      <span className="option-letter">{opt.toUpperCase()}.</span>
                      <span className="option-text">{q[`option_${opt}`]}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {q.question_type === QUESTION_TYPES.QNA && (
              <div className="qna-answer">
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleSubmit}
        className="submit-button"
      >
        Submit Test
      </button>

      {/* Add this CSS in your stylesheet */}
      <style>{`
        .test-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .test-title {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 30px;
        }
        
        .questions-list {
          margin-bottom: 40px;
        }
        
        .question-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        
        .question-number {
          font-weight: bold;
          color: #3498db;
        }
        
        .question-type-badge {
          background: #e74c3c;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .question-content {
          margin: 0 0 15px 0;
          color: #34495e;
        }
        
        .mcq-options {
          display: grid;
          gap: 12px;
        }
        
        .mcq-option {
          display: flex;
          align-items: center;
        }
        
        .mcq-option input {
          margin-right: 10px;
          width: 18px;
          height: 18px;
        }
        
        .mcq-option label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .option-letter {
          font-weight: bold;
          margin-right: 5px;
          color: #3498db;
        }
        
        .qna-answer textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          font-family: inherit;
        }
        
        .submit-button {
          display: block;
          width: 100%;
          padding: 12px;
          background: #2ecc71;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .submit-button:hover {
          background: #27ae60;
        }
        
        .loading-spinner {
          text-align: center;
          padding: 50px;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default AttemptTest;