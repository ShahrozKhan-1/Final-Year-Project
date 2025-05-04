import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from '../auth';
import CreateSession from '../Components/CreateSession';
import axios from 'axios';

export default function TeacherPage() {
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole(); // Destructure properly
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Wait until role is loaded
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
          Authorization: `Bearer ${token}`
        }
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Failed to load sessions");
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleNavigation = () => {
    navigate('/teacher-request');
  };


  const goToSession = (sessionId) => {
    navigate(`/teacher/session/${sessionId}/tests`);
  };

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (loadingSessions) {
    return (
      <div className="p-4">Loading sessions...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">{error}</div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Teacher Dashboard</h1>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Session
        </button>
        <button
          onClick={handleNavigation}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Student Requests
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <CreateSession 
              onClose={() => {
                setShowModal(false);
                fetchTeacherSessions();
              }} 
            />
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">My Created Sessions:</h2>
      
      {sessions.length === 0 ? (
        <p className="text-center">You haven't created any sessions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <div key={session.id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-bold text-lg">{session.session_name}</h3>
              <p className="text-gray-600 mb-3">{session.description}</p>
              <button onClick={() => goToSession(session.id)}>View Tests</button>


            </div>
          ))}
        </div>
      )}
    </div>
  );
}