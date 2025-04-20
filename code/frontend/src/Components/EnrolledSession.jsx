// src/components/EnrolledSession.jsx
import React from 'react';

/**
 * EnrolledSession component
 * Renders a single enrolled session card with name, description, and times.
 * Props:
 *   - session: an object { id, session_name, description, start_time, end_time }
 */
export default function EnrolledSession({ session }) {
  return (
    <div className="p-4 rounded-2xl shadow-md bg-white">
      <h2 className="text-xl font-bold mb-2">{session.session_name}</h2>
      {session.description && <p className="mb-2">{session.description}</p>}
      <p className="text-sm">
        <strong>Start:</strong> {new Date(session.start_time).toLocaleString()}
      </p>
      <p className="text-sm">
        <strong>End:</strong> {new Date(session.end_time).toLocaleString()}
      </p>
    </div>
  );
}
