import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserRole } from '../auth';

export default function SessionDetails() {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const token = localStorage.getItem("access_token");

  const handleAttempt = async (testId) => {
    navigate(`/student/attempt-test/${testId}`);
  };
  

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (roleLoading) return;

    if (role !== "student") {
      navigate("/login");
      return;
    }

    const fetchSessionAndTests = async () => {
        try {
          setLoading(true);
      
          const response = await fetch(
            `http://127.0.0.1:8000/session/${sessionId}/detail/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
      
          if (!response.ok) throw new Error("Failed to fetch session details");
      
          const data = await response.json();
          setSession(data.session);
          setTests(data.unattempted_tests);
        } catch (err) {
          console.error(`Error fetching session ${sessionId}:`, err);
          setError(`Failed to load session details`);
        } finally {
          setLoading(false);
        }
      };
      

    fetchSessionAndTests();
  }, [sessionId, role, roleLoading, navigate, token]);

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (loading) return <div className="p-4">Loading session details...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <button
        onClick={handleBackToDashboard}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Dashboard
      </button>

      <button
        onClick={() => navigate("/student/attempted-tests")}
        className="mb-4 ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        View Attempted Tests
      </button>


      {session && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">{session.name}</h1>
          <p className="text-gray-600 mb-4">{session.description}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tests</h2>
        
        {tests.length === 0 ? (
          <p className="text-gray-500">No tests available for this session.</p>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{test.title}</h3>
                <p className="text-gray-600 mb-3">{test.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Duration: {test.duration} minutes
                  </span>
                  <button
                    onClick={() => handleAttempt(test.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Attempt Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}