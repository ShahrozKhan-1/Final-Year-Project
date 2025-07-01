import { useEffect, useState } from "react";

export default function SessionList() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetch("http://localhost:8000/admin/sessions/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-2">All Sessions</h2>
      <ul>
        {sessions.map((session) => (
          <li key={session.id} className="border-b py-2">
            <p><strong>Session:</strong> {session.title}</p>
            <p><strong>Teacher:</strong> {session.teacher.name}</p>
            <p><strong>Total Tests:</strong> {session.tests.length}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
