import { useEffect, useState } from "react";
import axios from "axios";

const EnrollSession = () => {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");

  const fetchSessions = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get("http://127.0.0.1:8000/sessions/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const enrollSession = async (sessionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/sessions/enroll/${sessionId}/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(response.data.message);
      fetchSessions(); // Optionally refresh the sessions list
    } catch (error) {
      setMessage("Error enrolling in session.");
      console.error(error.response?.data || error);
    }
  };

  return (
    <div>
      <h2>Available Sessions</h2>
      {message && <p>{message}</p>}
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <h3>{session.session_name}</h3>
            <p>{session.description}</p>
            <p>Starts: {session.start_time}</p>
            <p>Ends: {session.end_time}</p>
            <button onClick={() => enrollSession(session.id)}>Enroll</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EnrollSession;
