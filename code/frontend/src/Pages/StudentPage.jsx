// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EnrolledSession from '../Components/EnrolledSession';

/**
 * StudentDashboard page
 * Fetches and displays enrolled sessions, and provides navigation to enroll page.
 */
export default function StudentDashboard() {
  const [state, setState] = useState({ loading: true, error: null, sessions: [] });
  const navigate = useNavigate();

  const handleEnrollSessionClick = () => {
    navigate('/student/enroll-session');
  };

  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${'http://127.0.0.1:8000'}/sessions/enrolled/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching sessions: ${text}`);
        }

        const data = await response.json();
        setState({ loading: false, error: null, sessions: data });
      } catch (err) {
        console.error(err); // Log error for debugging
        setState({ loading: false, error: 'Failed to load sessions. Please try again later.', sessions: [] });
      }
    };

    fetchSessions();
  }, [navigate]);

  if (state.loading) return <div className="p-4">Loading sessions...</div>;
  if (state.error) return <div className="p-4 text-red-500">{state.error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4 text-center">Welcome to Your Dashboard</h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={handleEnrollSessionClick}
          className="px-4 py-2 text-base font-medium rounded-2xl shadow hover:shadow-lg transition"
          style={{ backgroundColor: '#007bff', color: '#fff' }}
        >
          Enroll in a Session
        </button>
      </div>
      {state.sessions.length === 0 ? (
        <p className="text-center">You are not enrolled in any sessions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.sessions.map(session => (
            <EnrolledSession key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}