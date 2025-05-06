import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AttemptedTests() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/student/attempted-tests/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAttempts(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching attempts:", err);
        setError(err.message || "Failed to load attempted tests");
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [token, navigate]);

  const handleView = (attemptId) => {
    if (!attemptId) {
      console.error("Attempt ID is undefined");
      return;
    }
    navigate(`/student/attempted-tests/${attemptId}`);
  };

  const handleDownloadPDF = (attemptId) => {
    if (!attemptId) {
      console.error("Attempt ID is undefined for PDF download");
      return;
    }
   // Assuming token is stored in localStorage
  
    if (!token) {
      console.error("No authentication token found");
      return;
    }
  
    // Create the request to download the PDF
    fetch(`http://127.0.0.1:8000/student/attempted-tests/${attemptId}/pdf/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,  // Include the token in the Authorization header
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      return response.blob();  // Convert the response to a blob
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_attempt_${attemptId}.pdf`; // Provide the file name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);  // Clean up
    })
    .catch(error => {
      console.error('Error downloading PDF:', error);
    });
  };
  

  if (loading) return <div className="p-4">Loading attempted tests...</div>;

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Attempted Tests</h2>
      {attempts.length === 0 ? (
        <p className="text-gray-500">No attempted tests found.</p>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {attempt.test_title || "Untitled Test"}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Score: {typeof attempt.score === 'number' ? attempt.score : 'N/A'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Session: {attempt.session_name || 'Unknown session'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(attempt.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(attempt.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}