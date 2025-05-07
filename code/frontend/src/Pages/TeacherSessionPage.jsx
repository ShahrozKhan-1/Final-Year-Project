import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserRole } from '../auth.js';

const TeacherSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState(null);
  
  const { role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && role !== 'teacher') {
      navigate('/unauthorized');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        // Fetch tests
        const testsRes = await axios.get(`http://127.0.0.1:8000/teacher/session/${sessionId}/tests/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const testsData = testsRes.data;
        if (Array.isArray(testsData)) {
          setTests(testsData);
        } else if (Array.isArray(testsData.tests)) {
          setTests(testsData.tests);
        } else {
          console.error("Unexpected tests response:", testsData);
          setTests([]);
        }
        setLoadingTests(false);

        // Fetch students
        const studentsRes = await axios.get(`http://127.0.0.1:8000/sessions/${sessionId}/students/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(studentsRes.data);
        setLoadingStudents(false);

      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError("Failed to load session data. Please try again.");
        setLoadingTests(false);
        setLoadingStudents(false);
      }
    };

    if (role === 'teacher') {
      fetchData();
    }
  }, [sessionId, role, roleLoading, navigate]);

  const handleDeleteTest = async (testId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this test?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/tests/${testId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(prevTests => prevTests.filter(test => test.id !== testId));
    } catch (error) {
      console.error('Failed to delete test:', error);
      setError("Failed to delete test. Please try again.");
    }
  };

  if (roleLoading) {
    return <div className="p-4">Checking permissions...</div>;
  }

  if (role !== 'teacher') {
    return <div className="p-4">You don't have permission to access this page.</div>;
  }

  if (loadingTests || loadingStudents) {
    return <div className="p-4">Loading session data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Session Details</h1>
        <button
          onClick={() => navigate(`/create-test/${sessionId}`)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Test
        </button>
      </div>

      {/* Modified grid layout with 3:1 ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content - Tests (takes 3/4 width) */}
        <div className="lg:col-span-3 border p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Tests in This Session</h2>
          {tests.length === 0 ? (
            <p>No tests available.</p>
          ) : (
            tests.map(test => (
              <div key={test.id} className="p-4 border-b mb-4">
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
                  <button
                    onClick={() => navigate(`/teacher/tests/${test.id}/attempts`)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    View Results
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Smaller Students Column (takes 1/4 width) */}
        <div className="lg:col-span-1 border p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Enrolled Students</h2>
            <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">
              {students.length}
            </span>
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-gray-500">No students enrolled yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[500px] overflow-y-auto">
              {students.map(student => (
                <li key={student.id} className="border-b py-2 text-sm">
                  <p className="font-medium truncate">{student.full_name || student.username}</p>
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherSessionPage;