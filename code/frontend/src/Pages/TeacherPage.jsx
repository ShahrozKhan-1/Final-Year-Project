import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from '../auth';
import CreateSession from '../Components/CreateSession';
import axios from 'axios';

export default function TeacherPage() {
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (roleLoading) return;

    if (role !== "teacher") {
      navigate("/login");
      return;
    }

    fetchTeacherSessions();
  }, [role, roleLoading, navigate, token]);

  const fetchTeacherSessions = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/teacher-sessions/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/sessions/${sessionId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTeacherSessions();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete session.");
    }
  };

  const goToSession = (sessionId) => {
    navigate(`/teacher/session/${sessionId}/tests`);
  };

  const viewResults = (sessionId) => {
    navigate(`/teacher/session/${sessionId}/results`);
  };

  const totalStudents = sessions.reduce((acc, session) => acc + session.student_count, 0);
  const totalPending = sessions.reduce((acc, session) => acc + session.pending_requests, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-6">📘 Teacher Dashboard</h1>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Add Session
        </button>
        <button
          onClick={() => navigate('/teacher-request')}
          className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
        >
          📥 Student Requests
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Sessions" value={sessions.length} color="blue" />
        <StatCard title="Total Students" value={totalStudents} color="green" />
        <StatCard title="Pending Requests" value={totalPending} color="yellow" />
        <StatCard title="Upcoming Sessions" value={sessions.filter(s => new Date(s.start_time) > new Date()).length} color="purple" />
      </div>

      {/* Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <CreateSession onClose={() => {
              setShowModal(false);
              fetchTeacherSessions();
            }} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <p className="mb-4 font-medium text-gray-700">Are you sure you want to delete this session?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => goToSession(confirmDeleteId)}
                className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                View Tests
              </button>
              <button
                onClick={() => viewResults(confirmDeleteId)}
                className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                View Results
              </button>
              <button
                onClick={() => deleteSession(confirmDeleteId)}
                className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Cards */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">🗂 My Created Sessions</h2>
      {loading ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-center text-gray-600">You haven't created any sessions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition bg-white"
            >
              <h3 className="text-xl font-bold text-blue-700">{session.session_name}</h3>
              <p className="text-gray-600 mt-1 mb-2">{session.description}</p>
              <div className="text-sm text-gray-500 mb-4 space-y-1">
                <p><strong>Created:</strong> {new Date(session.created_at).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> {session.duration_minutes} mins</p>
                <p><strong>Students Enrolled:</strong> {session.student_count}</p>
                <p><strong>Pending Requests:</strong> {session.pending_requests}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => goToSession(session.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                  View Tests
                </button>
                <button
                  onClick={() => viewResults(session.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                >
                  View Results
                </button>
                <button
                  onClick={() => setConfirmDeleteId(session.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className={`p-4 rounded-lg shadow ${colors[color]}`}>
      <p className="text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
};
