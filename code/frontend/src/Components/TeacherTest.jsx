import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const TeacherTest = () => {
  const [testData, setTestData] = useState(null);
  const [updatedQuestions, setUpdatedQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([]);
  const [deleteQuestionIds, setDeleteQuestionIds] = useState([]);
  const [newQuestionInput, setNewQuestionInput] = useState({
    content: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
  });

  const { testId } = useParams();

  // Fetch test data
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const token = localStorage.getItem('access_token');

        const response = await axios.get(`http://127.0.0.1:8000/api/tests/${testId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTestData(response.data);
        setUpdatedQuestions(response.data.questions || []);
      } catch (error) {
        console.error('Error fetching test:', error);
      }
    };

    fetchTest();
  }, [testId]);

  // Update a question field
  const handleQuestionUpdate = (questionId, field, value) => {
    setUpdatedQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    );
  };

  // Update new question input
  const handleNewQuestionInputChange = (field, value) => {
    setNewQuestionInput(prev => ({ ...prev, [field]: value }));
  };

  // Add new question to list
  const addNewQuestion = () => {
    setNewQuestions(prev => [...prev, newQuestionInput]);
    setNewQuestionInput({
      content: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: '',
    });
  };

  // Mark question for deletion
  const handleDeleteQuestion = questionId => {
    setDeleteQuestionIds(prev => [...prev, questionId]);
    setUpdatedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  // Save test changes
  const handleSaveTest = () => {
    const token = localStorage.getItem('access_token');
    const data = {
      questions: updatedQuestions,
      delete_questions: deleteQuestionIds,
      new_questions: newQuestions,
    };

    axios
      .patch(`http://127.0.0.1:8000/api/tests/${testId}/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        alert('Test updated successfully.');
        window.location.reload();
      })
      .catch(error => {
        console.error('Error updating test:', error);
        alert('Failed to update the test.');
      });
  };

  if (!testData) {
    return <div>Loading test data...</div>;
  }

  return (
    <div>
      <h1>Edit Test: {testData.title}</h1>
      <h3>Description: {testData.description}</h3>

      <div>
        <h3>Existing Questions</h3>
        {updatedQuestions.map((q, index) => (
          <div key={q.id} style={{ border: '1px solid #ccc', marginBottom: '15px', padding: '10px' }}>
            <h4>Question {index + 1}</h4>
            <input
              type="text"
              value={q.content}
              onChange={e => handleQuestionUpdate(q.id, 'content', e.target.value)}
              placeholder="Question"
            /><br />
            <input
              type="text"
              value={q.option_a}
              onChange={e => handleQuestionUpdate(q.id, 'option_a', e.target.value)}
              placeholder="Option A"
            /><br />
            <input
              type="text"
              value={q.option_b}
              onChange={e => handleQuestionUpdate(q.id, 'option_b', e.target.value)}
              placeholder="Option B"
            /><br />
            <input
              type="text"
              value={q.option_c}
              onChange={e => handleQuestionUpdate(q.id, 'option_c', e.target.value)}
              placeholder="Option C"
            /><br />
            <input
              type="text"
              value={q.option_d}
              onChange={e => handleQuestionUpdate(q.id, 'option_d', e.target.value)}
              placeholder="Option D"
            /><br />
            <input
              type="text"
              value={q.correct_option}
              onChange={e => handleQuestionUpdate(q.id, 'correct_option', e.target.value)}
              placeholder="Correct Option"
            /><br />
            <button onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
          </div>
        ))}
      </div>

      <div>
        <h3>Add New Question</h3>
        <input
          type="text"
          placeholder="Question"
          value={newQuestionInput.content}
          onChange={e => handleNewQuestionInputChange('content', e.target.value)}
        /><br />
        <input
          type="text"
          placeholder="Option A"
          value={newQuestionInput.option_a}
          onChange={e => handleNewQuestionInputChange('option_a', e.target.value)}
        /><br />
        <input
          type="text"
          placeholder="Option B"
          value={newQuestionInput.option_b}
          onChange={e => handleNewQuestionInputChange('option_b', e.target.value)}
        /><br />
        <input
          type="text"
          placeholder="Option C"
          value={newQuestionInput.option_c}
          onChange={e => handleNewQuestionInputChange('option_c', e.target.value)}
        /><br />
        <input
          type="text"
          placeholder="Option D"
          value={newQuestionInput.option_d}
          onChange={e => handleNewQuestionInputChange('option_d', e.target.value)}
        /><br />
        <input
          type="text"
          placeholder="Correct Option"
          value={newQuestionInput.correct_option}
          onChange={e => handleNewQuestionInputChange('correct_option', e.target.value)}
        /><br />
        <button onClick={addNewQuestion}>Add Question</button>
      </div>

      <hr />
      <button onClick={handleSaveTest}>Save Test</button>
    </div>
  );
};

export default TeacherTest;
