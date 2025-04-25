// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EnrolledSession from "../Components/EnrolledSession";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  const handleEnrollSessionClick = () => {
    navigate("/student/enroll-session");
  };

  useEffect(() => {
    const fetchEnrolledSessions = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/sessions/enrolled/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching sessions: ${text}`);
        }

        const data = await response.json();

        // Deduplicate sessions by ID
        const uniqueSessions = Array.from(
          new Map(data.map((s) => [s.id, s])).values()
        );

        setSessions(uniqueSessions);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load sessions. Please try again later.");
        setLoading(false);
      }
    };

    fetchEnrolledSessions();
  }, [navigate]);

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
            <EnrolledSession key={session.id} session={session} />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition duration-300">
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
