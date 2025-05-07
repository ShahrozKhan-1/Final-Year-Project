import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const TeacherTestAttempts = () => {
  const { testId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await fetch(`http://localhost:8000/teacher/tests/${testId}/attempts/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch attempts");
        const data = await res.json();
        setAttempts(data);
      } catch (err) {
        console.error("Error fetching attempts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [testId, token]);

  const handleDownload = async (attemptId) => {
    try {
      const res = await fetch(`http://localhost:8000/teacher/attempts/${attemptId}/download/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attempt_${attemptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (loading) return <div>Loading attempts...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Attempts</h2>
      {attempts.length === 0 ? (
        <p>No attempts found.</p>
      ) : (
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Submitted</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td className="border px-4 py-2">{attempt.student_name}</td>
                <td className="border px-4 py-2">{attempt.student_email}</td>
                <td className="border px-4 py-2">
                  {attempt.correct_answers} / {attempt.total_questions}
                </td>
                <td className="border px-4 py-2">
                  {new Date(attempt.end_time).toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleDownload(attempt.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherTestAttempts;