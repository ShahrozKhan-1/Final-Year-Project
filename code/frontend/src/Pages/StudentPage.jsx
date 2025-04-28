import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from '../auth';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionTests, setSessionTests] = useState({}); // Stores tests for each session
  const [loadingTests, setLoadingTests] = useState({}); // Loading states for each session's tests
  const navigate = useNavigate();
  const role = useUserRole();

  const handleEnrollSessionClick = () => {
    navigate("/student/enroll-session");
  };

  // Fetch tests for a specific session
  const fetchTestsForSession = async (sessionId) => {
    setLoadingTests(prev => ({ ...prev, [sessionId]: true }));
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/sessions/${sessionId}/tests/`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tests");
      
      const data = await response.json();
      setSessionTests(prev => ({ ...prev, [sessionId]: data }));
    } catch (err) {
      console.error(`Error fetching tests for session ${sessionId}:`, err);
      setError(`Failed to load tests for session`);
    } finally {
      setLoadingTests(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (role === "student") {
      const fetchEnrolledSessions = async () => {
        try {
          const response = await fetch("http://127.0.0.1:8000/sessions/enrolled/", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Failed to fetch sessions");
          
          const data = await response.json();
          setSessions(data);
          
          // Fetch tests for each session
          data.forEach(session => {
            fetchTestsForSession(session.id);
          });
          
          setLoading(false);
        } catch (err) {
          console.error(err);
          setError("Failed to load sessions");
          setLoading(false);
        }
      };

      fetchEnrolledSessions();
    } else if (role !== null) {
      navigate("/login");
    }
  }, [role, navigate]);

  const handleAttemptTest = (testId) => {
    navigate(`/student/attempt-test/${testId}`);
  };

  if (loading) return <div className="p-4">Loading sessions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4 text-center">
        Welcome to Your Dashboard
      </h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={handleEnrollSessionClick}
          className="px-4 py-2 text-base font-medium rounded-2xl shadow hover:shadow-lg transition"
          style={{ backgroundColor: "#007bff", color: "#fff" }}
        >
          Enroll in a Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center">You are not enrolled in any sessions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-bold text-lg mb-2">{session.name}</h3>
              <p className="text-gray-600 mb-3">{session.description}</p>
              
              {/* Tests section */}
              <div className="mt-4 border-t pt-3">
                <h4 className="font-semibold mb-2">Tests:</h4>
                {loadingTests[session.id] ? (
                  <p className="text-sm text-gray-500">Loading tests...</p>
                ) : sessionTests[session.id]?.length > 0 ? (
                  <ul className="space-y-2">
                    {sessionTests[session.id].map((test) => (
                      <li key={test.id} className="flex justify-between items-center">
                        <span className="text-sm">{test.title}</span>
                        <button
                          onClick={() => handleAttemptTest(test.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Attempt
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No tests available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition duration-300 mt-6">
        <h2 className="text-xl font-semibold mb-2">Practice Mode</h2>
        <p className="text-gray-600 mb-4">
          Practice by uploading a document or topic and receive auto-generated
          questions.
        </p>
        <button
          onClick={() => navigate("/student/practice")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Practice Mode
        </button>
      </div>
    </div>
  );
}