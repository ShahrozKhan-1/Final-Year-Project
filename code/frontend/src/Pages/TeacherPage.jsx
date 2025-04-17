import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateSession from '../Components/CreateSession';
import { useNavigate } from "react-router-dom";

function TeacherPage() {
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchTeacherSessions();
  }, []);

  const fetchTeacherSessions = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/teacher-sessions/", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error.response?.data || error);
    }
  };

  const handleNavigation = () => {
    navigate('/teacher-request');
  };

  return (
    <div>
      <h2>Teacher Dashboard</h2>
      <button onClick={() => setShowModal(true)}>Add Session</button>
      {showModal && (
        <div className="modal">
          <CreateSession onClose={() => { setShowModal(false); fetchTeacherSessions(); }} />
        </div>
      )}
      <button onClick={handleNavigation}>Student Request</button>

      <h3>My Created Sessions:</h3>
      {sessions.map(session => (
        <div key={session.id}>
          <h4>{session.session_name}</h4>
          <p>{session.description}</p>
          {/* Button for creating test in this session */}
          <button onClick={() => navigate(`/create-test/${session.id}`)}>Create Test</button>
        </div>
      ))}
    </div>
  );
}

export default TeacherPage;
