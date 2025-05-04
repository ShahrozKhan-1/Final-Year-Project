// src/pages/TeacherSessionPage.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`http://127.0.0.1:8000/teacher/session/${sessionId}/tests/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const data = res.data;
  
        // Add a safeguard: check if it's an array
        if (Array.isArray(data)) {
          setTests(data);
        } else if (Array.isArray(data.tests)) {
          setTests(data.tests);
        } else {
          console.error("Unexpected response:", data);
          setTests([]);
        }
  
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tests:', error);
        setTests([]);
        setLoading(false);
      }
    };
  
    fetchTests();
  }, [sessionId]);
  

  const handleDeleteTest = async (testId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this test?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/tests/${testId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTests(prevTests => prevTests.filter(test => test.id !== testId));
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tests in This Session</h1>
      {tests.length === 0 ? (
        <p>No tests available.</p>
      ) : (
        tests.map(test => (
          <div key={test.id} className="p-4 border rounded shadow mb-4">
            <h3 className="text-lg font-medium">{test.title}</h3>
            <p className="text-sm text-gray-600">{test.description}</p>
            <p className="text-xs text-gray-500">
              Time Limit: {test.time_limit_minutes} minutes | 
              Created at: {new Date(test.created_at).toLocaleString()}
            </p>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => navigate(`/teacher/test/${test.id}`)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                View & Edit
              </button>
              <button
                onClick={() => handleDeleteTest(test.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TeacherSessionPage;
