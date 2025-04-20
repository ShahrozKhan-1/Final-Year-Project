// src/components/EnrollSession.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const EnrollSession = () => {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [enrolledSessions, setEnrolledSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    const token = localStorage.getItem("access_token");
    setLoading(true);
    try {
      const [allSessionsRes, enrolledRes] = await Promise.all([
        axios.get(`${'http://127.0.0.1:8000'}/sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${'http://127.0.0.1:8000'}/sessions/enrolled/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const enrolledSessionIds = new Set(enrolledRes.data.map(session => session.id));
      const filteredSessions = allSessionsRes.data.filter(session => !enrolledSessionIds.has(session.id));

      setAvailableSessions(filteredSessions);
      setEnrolledSessions(enrolledRes.data);
    } catch (error) {
      console.error("Error fetching sessions:", error.response?.data || error);
      setMessage("Failed to load sessions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const requestEnrollment = async (sessionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.patch(
        `${'http://127.0.0.1:8000'}/sessions/enroll-request/${sessionId}/`, 
        {}, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(response.data.message);
      await fetchSessions();
    } catch (error) {
      setMessage("Error requesting enrollment.");
      console.error(error.response?.data || error);
    }
  };

  // Simple debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedRequestEnrollment = debounce(requestEnrollment, 300);

  return (
    <div>
      <h2>Available Sessions</h2>
      {loading ? <p>Loading sessions...</p> : message && <p>{message}</p>}
      <ul>
        {availableSessions.map((session) => (
          <li key={session.id}>
            <h3>{session.session_name}</h3>
            <p>{session.description}</p>
            <p>Starts: {session.start_time}</p>
            <p>Ends: {session.end_time}</p>
            <button 
              onClick={() => debouncedRequestEnrollment(session.id)} 
              aria-label={`Enroll in ${session.session_name}`}
            >
              Enroll
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EnrollSession;